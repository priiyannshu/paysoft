import { Hono } from 'hono'
import { authMiddleware } from './middleware/org-id'
import { cacheControlMiddleware } from './middleware/cache-control'
import { securityHeadersMiddleware } from './security/headers'
import { traceIdMiddleware, errorBoundaryMiddleware } from './lib/logging'
import { authLoginLimiter, payrollRunLimiter, generalApiLimiter } from './middleware/rate-limit'
import { authRoutes } from './engines/1-auth/routes'
import { tax } from './lib/tax/routes'
import { payroll } from './lib/payroll/routes'
import { ess } from './lib/ess/routes'
import { audit } from './lib/audit/routes'
import { docs } from './lib/docs/routes'
import { notify } from './engines/7-notify/routes'
import { apiRoutes } from './engines/api/routes'
import { adminRoutes } from './admin/routes'
import { aiRoutes } from './ai/routes'
import { handlePayslipQueue } from './queues/payslip-consumer'
import { handleNotifyQueue } from './queues/notify-consumer'
import { handleScheduledBackup } from './crons/backup'
import { PayrollRunLock } from './lib/payroll/durable-object'
import type { KVNamespace } from '@cloudflare/workers-types'

interface Env {
  DB: D1Database
  ASSETS: Fetcher
  BUCKET?: R2Bucket
  KV: KVNamespace
  PAYROLL_LOCK: DurableObjectNamespace
  PAYSLIP_QUEUE?: Queue<any>
  NOTIFY_QUEUE?: Queue<any>
  VECTORIZE_INDEX?: VectorizeIndex
  AI?: any
  SEND_EMAIL?: any
  SENDER_EMAIL_ADDRESS?: string
}

const app = new Hono<{ Bindings: Env }>()

// Global error boundary
app.onError(errorBoundaryMiddleware)

// 0. Security and Tracing
app.use('*', traceIdMiddleware)
app.use('*', securityHeadersMiddleware)

// 1. Global Cache-Control header strategy middleware
app.use('*', cacheControlMiddleware)

// 2. Global authentication and multi-tenant resolution
app.use('*', authMiddleware)

// 3. Rate limiting rules
app.use('/auth/login', authLoginLimiter)
app.use('/api/payroll/run', payrollRunLimiter)
app.use('/api/*', generalApiLimiter)

app.get('/api/health', (c) => {
  return c.json({ ok: true, version: '2.0.0', stage: 'phase-10-11-availability-scaling' })
})

app.route('/auth', authRoutes)
app.route('/api/tax', tax)
app.route('/api/payroll', payroll)
app.route('/api/ess', ess)
app.route('/api/audit', audit)
app.route('/api/docs', docs)
app.route('/api/notify', notify)
app.route('/api/admin', adminRoutes)
app.route('/admin', adminRoutes)
app.route('/api/ai', aiRoutes)
app.route('/api', apiRoutes)
app.route('/docs', docs)

export default {
  fetch: app.fetch,
  async scheduled(event: any, env: Env, ctx: any): Promise<void> {
    await handleScheduledBackup(event, env, ctx)
  },
  async queue(batch: MessageBatch<any>, env: Env): Promise<void> {
    const queueName = batch.queue || ''

    if (queueName === 'paysoft-payslip-queue' || queueName.includes('payslip')) {
      await handlePayslipQueue(batch, env)
    } else if (queueName === 'paysoft-notify-queue' || queueName.includes('notify')) {
      await handleNotifyQueue(batch, env)
    } else {
      // Intelligently route based on message structure if queue name is generic/local
      const firstMsg = batch.messages[0]?.body
      if (firstMsg?.employeeId && (firstMsg?.jobId || firstMsg?.month)) {
        await handlePayslipQueue(batch, env)
      } else {
        await handleNotifyQueue(batch, env)
      }
    }
  },
}

export { app, PayrollRunLock }
export type AppType = typeof app
