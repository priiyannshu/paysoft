import { Hono } from 'hono'
import { generateAuditReport } from './engine'
import { getCached, setCache, CACHE_KEYS, CACHE_TTLS } from '../../cache/kv'
import type { EmployeeRecord, AuditReport } from './types'

interface AuditEnv {
  Bindings: {
    DB: D1Database
    KV?: KVNamespace
  }
}

const audit = new Hono<AuditEnv>()

async function computeAuditForOrg(db: D1Database, orgId: string): Promise<AuditReport> {
  // 1. Get employees from D1
  const { results: empRows } = await db.prepare(
    `SELECT * FROM employees WHERE org_id = ?`
  ).bind(orgId).all()

  const employees: EmployeeRecord[] = empRows.map((r: any) => ({
    id: r.id,
    orgId: r.org_id,
    pan: r.pan || r.pan_number,
    aadhaar: r.aadhaar || r.aadhaar_number,
    bankAccount: r.bank_account,
    pfUan: r.pf_uan,
    esiNumber: r.esi_number,
    dateOfBirth: r.date_of_birth,
    salaryStructureId: r.salary_structure_id,
  }))

  // 2. Check prior month freeze status
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  const lastMonthYear = d.getFullYear()
  const lastMonth = d.getMonth() + 1 // 1-12

  const previousRun = await db.prepare(
    `SELECT status FROM payroll_runs WHERE org_id = ? AND year = ? AND month = ?`
  ).bind(orgId, lastMonthYear, lastMonth).first<{ status: string }>()

  const priorMonthFrozen = !previousRun || previousRun.status === 'frozen'

  // 3. Generate report
  const report = generateAuditReport(orgId, employees, priorMonthFrozen)

  // 4. Persist to DB for durable history
  try {
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS audit_reports (
        org_id TEXT PRIMARY KEY,
        report_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    ).run()

    await db.prepare(
      `INSERT INTO audit_reports (org_id, report_json, updated_at) 
       VALUES (?, ?, ?) 
       ON CONFLICT(org_id) DO UPDATE SET report_json = excluded.report_json, updated_at = excluded.updated_at`
    ).bind(orgId, JSON.stringify(report), new Date().toISOString()).run()
  } catch (e) {
    console.error('Failed to save audit report to DB:', e)
  }

  return report
}

audit.get('/run', async (c) => {
  const orgId = c.req.query('orgId')
  if (!orgId) {
    return c.json({ error: 'orgId query parameter is required' }, 400)
  }

  const bypassCache = c.req.query('fresh') === 'true' || c.req.query('bypass') === 'true'
  const key = CACHE_KEYS.auditResults(orgId)

  if (bypassCache) {
    const freshReport = await computeAuditForOrg(c.env.DB, orgId)
    await setCache(c.env.KV, key, freshReport, CACHE_TTLS.AUDIT_RESULTS)
    return c.json(freshReport)
  }

  const report = await getCached<AuditReport>(
    c.env.KV,
    key,
    CACHE_TTLS.AUDIT_RESULTS,
    () => computeAuditForOrg(c.env.DB, orgId)
  )

  return c.json(report)
})

audit.get('/status/:orgId', async (c) => {
  const orgId = c.req.param('orgId')
  const key = CACHE_KEYS.auditResults(orgId)

  // 1. Try KV cache
  if (c.env.KV) {
    try {
      const cached = await c.env.KV.get(key, 'json')
      if (cached) {
        return c.json(cached)
      }
    } catch {
      // ignore
    }
  }

  // 2. Try DB
  try {
    const row = await c.env.DB.prepare(
      `SELECT report_json FROM audit_reports WHERE org_id = ?`
    ).bind(orgId).first<{ report_json: string }>()

    if (row && row.report_json) {
      const report = JSON.parse(row.report_json)
      await setCache(c.env.KV, key, report, CACHE_TTLS.AUDIT_RESULTS)
      return c.json(report)
    }
  } catch {
    // Table might not exist yet
  }

  return c.json({ error: 'No audit report found for this organization' }, 404)
})

export { audit }
