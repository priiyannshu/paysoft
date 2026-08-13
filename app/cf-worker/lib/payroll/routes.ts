import { Hono } from 'hono'
import { executePayrollRun } from './engine'
import type { PayrollRunInput, PayrollRunStatus } from './types'

interface PayrollEnv {
  Bindings: {
    DB: D1Database
    PAYROLL_LOCK: DurableObjectNamespace
  }
}

const payroll = new Hono<PayrollEnv>()

/**
 * POST /payroll/run
 *
 * Execute a full payroll run:
 * 1. Acquire DO lock (prevents concurrent runs for same org+month)
 * 2. Transition lock: draft → processing
 * 3. Compute all employee salaries
 * 4. Write salary records to D1
 * 5. Transition lock: processing → computed
 * 6. Release lock
 */
payroll.post('/run', async (c) => {
  const input = await c.req.json<PayrollRunInput>()
  const { orgId, month, year } = input

  // Get the DO stub keyed by org+month
  const lockId = c.env.PAYROLL_LOCK.idFromName(`${orgId}:${year}:${month}`)
  const lockStub = c.env.PAYROLL_LOCK.get(lockId)

  // Step 1: Acquire lock
  const runIdCandidate = `PR-${orgId}-${year}-${String(month).padStart(2, '0')}-${Date.now()}`
  const acquireRes = await lockStub.fetch(new Request('https://lock/acquire', {
    method: 'POST',
    body: JSON.stringify({ orgId, month, year, runId: runIdCandidate }),
    headers: { 'Content-Type': 'application/json' },
  }))

  if (!acquireRes.ok) {
    const err = await acquireRes.json() as { error: string }
    return c.json({ error: err.error }, 409)
  }

  const { runId } = await acquireRes.json() as { runId: string }

  try {
    // Step 2: draft → processing
    await lockStub.fetch(new Request('https://lock/transition', {
      method: 'POST',
      body: JSON.stringify({ nextStatus: 'processing' }),
      headers: { 'Content-Type': 'application/json' },
    }))

    // Step 3: Compute payroll
    const result = executePayrollRun(input)
    result.runId = runId

    // Step 4: Write to D1
    const now = new Date().toISOString()

    await c.env.DB.prepare(
      `INSERT INTO payroll_runs (id, org_id, month, year, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'computed', ?, ?)`
    ).bind(runId, orgId, month, year, now, now).run()

    const insertStmt = c.env.DB.prepare(
      `INSERT INTO salary_records
       (run_id, employee_id, gross_earnings, lop, arrears, bonuses, advance_recovery,
        total_earnings, total_deductions, net_pay, deductions_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )

    // Batch insert salary records
    const batch = result.records.map((r) =>
      insertStmt.bind(
        runId, r.employeeId, r.grossEarnings, r.lop, r.arrears, r.bonuses,
        r.advanceRecovery, r.totalEarnings, r.totalDeductions, r.netPay,
        JSON.stringify(r.deductions)
      )
    )

    await c.env.DB.batch(batch)

    // Step 5: processing → computed
    await lockStub.fetch(new Request('https://lock/transition', {
      method: 'POST',
      body: JSON.stringify({ nextStatus: 'computed' }),
      headers: { 'Content-Type': 'application/json' },
    }))

    return c.json(result, 201)

  } catch (err) {
    // Release lock on failure so the org isn't permanently locked
    await lockStub.fetch(new Request('https://lock/release', { method: 'POST' }))
    throw err
  }
})

/**
 * GET /payroll/status/:runId
 *
 * Retrieve a payroll run and its salary records.
 */
payroll.get('/status/:runId', async (c) => {
  const runId = c.req.param('runId')

  const run = await c.env.DB.prepare(
    `SELECT * FROM payroll_runs WHERE id = ?`
  ).bind(runId).first()

  if (!run) {
    return c.json({ error: 'Payroll run not found' }, 404)
  }

  const { results: records } = await c.env.DB.prepare(
    `SELECT * FROM salary_records WHERE run_id = ?`
  ).bind(runId).all()

  const parsed = records.map((r: Record<string, unknown>) => ({
    employeeId: r.employee_id,
    grossEarnings: r.gross_earnings,
    lop: r.lop,
    arrears: r.arrears,
    bonuses: r.bonuses,
    advanceRecovery: r.advance_recovery,
    totalEarnings: r.total_earnings,
    totalDeductions: r.total_deductions,
    netPay: r.net_pay,
    deductions: JSON.parse(r.deductions_json as string),
  }))

  return c.json({
    runId: run.id,
    orgId: run.org_id,
    month: run.month,
    year: run.year,
    status: run.status,
    employeeCount: parsed.length,
    totalNetPay: parsed.reduce((sum: number, r: any) => sum + Number(r.netPay || 0), 0),
    records: parsed,
  })
})

/**
 * POST /payroll/freeze/:monthId
 *
 * Freeze a payroll month (immutable — no further changes allowed).
 * monthId format: orgId:year:month (e.g., "ORG-1:2026:8")
 */
payroll.post('/freeze/:monthId', async (c) => {
  const monthId = c.req.param('monthId')
  const [orgId, yearStr, monthStr] = monthId.split(':')

  if (!orgId || !yearStr || !monthStr) {
    return c.json({ error: 'Invalid monthId format. Expected orgId:year:month' }, 400)
  }

  const year = parseInt(yearStr)
  const month = parseInt(monthStr)

  // Verify the payroll run exists and is in 'computed' state
  const run = await c.env.DB.prepare(
    `SELECT * FROM payroll_runs WHERE org_id = ? AND year = ? AND month = ? AND status = 'computed'`
  ).bind(orgId, year, month).first()

  if (!run) {
    return c.json({ error: 'No computed payroll run found for this month' }, 404)
  }

  // Transition the DO lock to frozen
  const lockId = c.env.PAYROLL_LOCK.idFromName(`${orgId}:${year}:${month}`)
  const lockStub = c.env.PAYROLL_LOCK.get(lockId)

  const transitionRes = await lockStub.fetch(new Request('https://lock/transition', {
    method: 'POST',
    body: JSON.stringify({ nextStatus: 'frozen' as PayrollRunStatus }),
    headers: { 'Content-Type': 'application/json' },
  }))

  if (!transitionRes.ok) {
    const err = await transitionRes.json() as { error: string }
    return c.json({ error: err.error }, 422)
  }

  // Update D1 status
  await c.env.DB.prepare(
    `UPDATE payroll_runs SET status = 'frozen', updated_at = ? WHERE id = ?`
  ).bind(new Date().toISOString(), run.id as string).run()

  // Release the lock — month is permanently frozen in D1
  await lockStub.fetch(new Request('https://lock/release', { method: 'POST' }))

  return c.json({
    frozen: true,
    runId: run.id,
    orgId,
    month,
    year,
  })
})

export { payroll }
