import { Hono } from 'hono'
import { tax } from './lib/tax/routes'
import { payroll } from './lib/payroll/routes'
import { ess } from './lib/ess/routes'
import { audit } from './lib/audit/routes'
import { docs } from './lib/docs/routes'
import { PayrollRunLock } from './lib/payroll/durable-object'

interface Env {
  DB: D1Database
  ASSETS: Fetcher
  PAYROLL_LOCK: DurableObjectNamespace
}

const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => {
  return c.json({ ok: true, version: '2.0.0' })
})

app.route('/api/tax', tax)
app.route('/api/payroll', payroll)
app.route('/api/ess', ess)
app.route('/api/audit', audit)
app.route('/api/docs', docs)
app.route('/docs', docs)

export default app

export { PayrollRunLock }

