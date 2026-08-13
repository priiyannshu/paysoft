import { Hono } from 'hono'
import { authMiddleware } from './middleware/org-id'
import { authRoutes } from './engines/1-auth/routes'
import { tax } from './lib/tax/routes'
import { payroll } from './lib/payroll/routes'
import { ess } from './lib/ess/routes'
import { audit } from './lib/audit/routes'
import { docs } from './lib/docs/routes'
import { notify } from './engines/7-notify/routes'
import { handleQueueMessage } from './engines/7-notify/queue'
import { PayrollRunLock } from './lib/payroll/durable-object'

interface Env {
  DB: D1Database
  ASSETS: Fetcher
  PAYROLL_LOCK: DurableObjectNamespace
  NOTIFY_QUEUE?: Queue<any>
  SEND_EMAIL?: any
  SENDER_EMAIL_ADDRESS?: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', authMiddleware)

app.get('/api/health', (c) => {
  return c.json({ ok: true, version: '2.0.0' })
})

app.route('/auth', authRoutes)
app.route('/api/tax', tax)
app.route('/api/payroll', payroll)
app.route('/api/ess', ess)
app.route('/api/audit', audit)
app.route('/api/docs', docs)
app.route('/api/notify', notify)
app.route('/docs', docs)

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    await handleQueueMessage(batch, env)
  }
}

export { PayrollRunLock }
export type AppType = typeof app
