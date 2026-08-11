import { Hono } from 'hono'

interface Env {
  DB: D1Database
  ASSETS: Fetcher
}

const app = new Hono<{ Bindings: Env }>()

app.get('/api/health', (c) => {
  return c.json({ ok: true, version: '2.0.0' })
})

export default app
