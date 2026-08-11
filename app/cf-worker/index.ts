import { Hono } from 'hono'
import { authMiddleware } from './middleware/org-id'
import { authRoutes } from './engines/1-auth/routes'

interface Env {
  DB: D1Database
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', authMiddleware)

app.get('/api/health', (c) => {
  return c.json({ ok: true, version: '2.0.0' })
})

app.route('/auth', authRoutes)

export default app
