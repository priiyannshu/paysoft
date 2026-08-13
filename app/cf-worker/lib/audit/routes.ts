import { Hono } from 'hono'
import { generateAuditReport } from './engine'
import type { EmployeeRecord } from './types'

interface AuditEnv {
  Bindings: {
    DB: D1Database
  }
}

const audit = new Hono<AuditEnv>()

audit.get('/run', async (c) => {
  const orgId = c.req.query('orgId')
  if (!orgId) {
    return c.json({ error: 'orgId query parameter is required' }, 400)
  }

  // 1. Get employees from D1
  const { results: empRows } = await c.env.DB.prepare(
    `SELECT * FROM employees WHERE org_id = ?`
  ).bind(orgId).all()

  const employees: EmployeeRecord[] = empRows.map((r: any) => ({
    id: r.id,
    orgId: r.org_id,
    pan: r.pan,
    aadhaar: r.aadhaar,
    bankAccount: r.bank_account,
    pfUan: r.pf_uan,
    esiNumber: r.esi_number,
    dateOfBirth: r.date_of_birth,
    salaryStructureId: r.salary_structure_id
  }))

  // 2. Check prior month freeze status
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  const lastMonthYear = d.getFullYear()
  const lastMonth = d.getMonth() + 1 // 1-12

  const previousRun = await c.env.DB.prepare(
    `SELECT status FROM payroll_runs WHERE org_id = ? AND year = ? AND month = ?`
  ).bind(orgId, lastMonthYear, lastMonth).first<{ status: string }>()

  const priorMonthFrozen = !previousRun || previousRun.status === 'frozen'

  // 3. Generate report
  const report = generateAuditReport(orgId, employees, priorMonthFrozen)

  // 4. Save report to DB (assuming an audit_reports table exists or we just return it)
  // The spec says "Output: JSON audit report with severity levels", doesn't strictly mention saving, 
  // but there's a GET /status/:orgId. We should probably save it or maybe just generate it on the fly.
  // "GET /audit/run" implies triggering a run, maybe we should save it. 
  // Let's create an audit_reports table if it doesn't exist, or just insert.
  // Actually, for a GET, saving is not ideal. But maybe /run creates it and returns it.
  
  // To support /status/:orgId, we need to save the latest report somewhere, or /status just re-runs it?
  // Let's just save it to KV or D1 if possible. Or maybe /status/:orgId also just generates it on the fly?
  // Wait, if /run is GET, maybe it's just generating and returning.
  // I will just save the report into a table `audit_reports` as JSON, just in case.
  try {
    await c.env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS audit_reports (
        org_id TEXT PRIMARY KEY,
        report_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    ).run()

    await c.env.DB.prepare(
      `INSERT INTO audit_reports (org_id, report_json, updated_at) 
       VALUES (?, ?, ?) 
       ON CONFLICT(org_id) DO UPDATE SET report_json = excluded.report_json, updated_at = excluded.updated_at`
    ).bind(orgId, JSON.stringify(report), new Date().toISOString()).run()
  } catch (e) {
    // Ignore DB errors if table doesn't exist or isn't migratable here, just return the report
    console.error('Failed to save audit report:', e)
  }

  return c.json(report)
})

audit.get('/status/:orgId', async (c) => {
  const orgId = c.req.param('orgId')

  try {
    const row = await c.env.DB.prepare(
      `SELECT report_json FROM audit_reports WHERE org_id = ?`
    ).bind(orgId).first<{ report_json: string }>()

    if (row && row.report_json) {
      return c.json(JSON.parse(row.report_json))
    }
  } catch (e) {
    // Table might not exist yet
  }

  return c.json({ error: 'No audit report found for this organization' }, 404)
})

export { audit }
