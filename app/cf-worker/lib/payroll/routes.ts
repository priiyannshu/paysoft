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
 * 1. Acquire DO lock & initialize progress tracking
 * 2. Transition lock: draft → processing (stage: 'calculating_tax')
 * 3. Compute all employee salaries
 * 4. Write salary records to D1 (stage: 'writing_records')
 * 5. Transition lock: processing → computed (stage: 'completed', percent: 100)
 * 6. Release lock
 */
payroll.post('/run', async (c) => {
  const input = await c.req.json<PayrollRunInput>()
  const { orgId, month, year } = input
  const totalEmployees = input.employees?.length || 0

  // Get the DO stub keyed by org+month
  const lockId = c.env.PAYROLL_LOCK.idFromName(`${orgId}:${year}:${month}`)
  const lockStub = c.env.PAYROLL_LOCK.get(lockId)

  // Step 1: Acquire lock with total employees count
  const runIdCandidate = `PR-${orgId}-${year}-${String(month).padStart(2, '0')}-${Date.now()}`
  const acquireRes = await lockStub.fetch(new Request('https://lock/acquire', {
    method: 'POST',
    body: JSON.stringify({ orgId, month, year, runId: runIdCandidate, totalEmployees }),
    headers: { 'Content-Type': 'application/json' },
  }))

  if (!acquireRes.ok) {
    const err = await acquireRes.json() as { error: string; progress?: any }
    return c.json({ error: err.error, progress: err.progress }, 409)
  }

  const { runId } = await acquireRes.json() as { runId: string }

  try {
    // Step 2: draft → processing & stage: calculating_tax
    await lockStub.fetch(new Request('https://lock/transition', {
      method: 'POST',
      body: JSON.stringify({ nextStatus: 'processing' }),
      headers: { 'Content-Type': 'application/json' },
    }))

    await lockStub.fetch(new Request('https://lock/progress/update', {
      method: 'POST',
      body: JSON.stringify({
        currentStage: 'calculating_tax',
        processedEmployees: 0,
        totalEmployees,
      }),
      headers: { 'Content-Type': 'application/json' },
    }))

    // Write audit log for run start
    let now = new Date().toISOString()
    await c.env.DB.prepare(
      `INSERT INTO audit_logs (event_type, payload, recipient, created_at) VALUES (?, ?, ?, ?)`
    ).bind('PAYROLL_RUN_STARTED', JSON.stringify({ runId }), 'SYSTEM', now).run()

    // Fetch approved tax declarations for employees
    const employeeIds = input.employees.map(e => e.employeeId)
    const placeholders = employeeIds.map(() => '?').join(',')
    
    let declarationsMap: Record<string, any> = {}
    if (employeeIds.length > 0) {
      const { results: decs } = await c.env.DB.prepare(
        `SELECT employee_id, declarations_json FROM tax_declarations WHERE status = 'approved' AND employee_id IN (${placeholders})`
      ).bind(...employeeIds).all()

      for (const dec of decs) {
        declarationsMap[dec.employee_id as string] = JSON.parse(dec.declarations_json as string)
      }
    }

    // Attach declarations to input
    for (const emp of input.employees) {
      if (declarationsMap[emp.employeeId]) {
        emp.declarations = declarationsMap[emp.employeeId]
      }
    }

    // Step 3: Compute payroll
    const result = executePayrollRun(input)
    result.runId = runId

    // Update progress: writing_records
    await lockStub.fetch(new Request('https://lock/progress/update', {
      method: 'POST',
      body: JSON.stringify({
        currentStage: 'writing_records',
        processedEmployees: Math.round(totalEmployees * 0.75),
      }),
      headers: { 'Content-Type': 'application/json' },
    }))

    // Step 4: Write to D1
    now = new Date().toISOString()

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

    // Step 5: processing → computed (sets stage to 'completed' and 100%)
    await lockStub.fetch(new Request('https://lock/progress/update', {
      method: 'POST',
      body: JSON.stringify({
        currentStage: 'completed',
        processedEmployees: totalEmployees,
        totalEmployees,
      }),
      headers: { 'Content-Type': 'application/json' },
    }))

    await lockStub.fetch(new Request('https://lock/transition', {
      method: 'POST',
      body: JSON.stringify({ nextStatus: 'computed' }),
      headers: { 'Content-Type': 'application/json' },
    }))

    // Write audit log for run completion
    await c.env.DB.prepare(
      `INSERT INTO audit_logs (event_type, payload, recipient, created_at) VALUES (?, ?, ?, ?)`
    ).bind('PAYROLL_RUN_COMPLETED', JSON.stringify({ runId }), 'SYSTEM', new Date().toISOString()).run()

    return c.json(result, 201)

  } catch (err: any) {
    // Report error to progress tracker and release lock on failure
    await lockStub.fetch(new Request('https://lock/progress/update', {
      method: 'POST',
      body: JSON.stringify({
        currentStage: 'failed',
        error: { employeeId: 'SYSTEM', reason: err?.message || 'Payroll computation error' }
      }),
      headers: { 'Content-Type': 'application/json' },
    })).catch(() => {})

    await lockStub.fetch(new Request('https://lock/release', { method: 'POST' })).catch(() => {})
    throw err
  }
})

/**
 * GET /payroll/run-progress/:runId
 *
 * Query live execution status and granular progress from DO for frontend progress bar.
 */
payroll.get('/run-progress/:runId', async (c) => {
  const runId = c.req.param('runId')

  // Find the run in DB to get org_id, month, year
  const run = await c.env.DB.prepare(
    `SELECT * FROM payroll_runs WHERE id = ?`
  ).bind(runId).first<any>()

  if (!run) {
    // If not found in DB yet, try to parse from standard runId format: PR-{orgId}-{year}-{month}-{ts}
    const parts = runId.split('-')
    if (parts.length >= 4) {
      const orgId = parts[1]
      const year = parseInt(parts[2], 10)
      const month = parseInt(parts[3], 10)
      const lockId = c.env.PAYROLL_LOCK.idFromName(`${orgId}:${year}:${month}`)
      const lockStub = c.env.PAYROLL_LOCK.get(lockId)
      const res = await lockStub.fetch(new Request('https://lock/progress'))
      if (res.ok) {
        const data = await res.json()
        return c.json(data)
      }
    }
    return c.json({ error: 'Payroll run progress not found', runId }, 404)
  }

  const lockId = c.env.PAYROLL_LOCK.idFromName(`${run.org_id}:${run.year}:${run.month}`)
  const lockStub = c.env.PAYROLL_LOCK.get(lockId)
  const res = await lockStub.fetch(new Request('https://lock/progress'))
  
  if (res.ok) {
    const data = await res.json()
    return c.json({
      runId,
      orgId: run.org_id,
      month: run.month,
      year: run.year,
      dbStatus: run.status,
      ...data
    })
  }

  return c.json({ runId, status: run.status })
})

/**
 * GET /payroll/progress/:monthId
 *
 * Query DO progress by monthId (format: orgId:year:month)
 */
payroll.get('/progress/:monthId', async (c) => {
  const monthId = c.req.param('monthId')
  const [orgId, yearStr, monthStr] = monthId.split(':')
  if (!orgId || !yearStr || !monthStr) {
    return c.json({ error: 'Invalid monthId format. Expected orgId:year:month' }, 400)
  }

  const lockId = c.env.PAYROLL_LOCK.idFromName(monthId)
  const lockStub = c.env.PAYROLL_LOCK.get(lockId)
  const res = await lockStub.fetch(new Request('https://lock/progress'))
  
  if (res.ok) {
    const data = await res.json()
    return c.json(data)
  }
  return c.json({ error: 'Failed to retrieve progress from lock' }, 500)
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

  // Write audit log for freeze
  await c.env.DB.prepare(
    `INSERT INTO audit_logs (event_type, payload, recipient, created_at) VALUES (?, ?, ?, ?)`
  ).bind('PAYROLL_RUN_FROZEN', JSON.stringify({ runId: run.id }), 'SYSTEM', new Date().toISOString()).run()

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
