import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { cacheControlMiddleware, CACHE_CONTROL_HEADERS } from './cache-control'

describe('Cache-Control Middleware (Phase 6)', () => {
  function createTestApp() {
    const app = new Hono()
    app.use('*', cacheControlMiddleware)

    app.get('/dist/main.bundle.js', (c) => c.text('console.log("hello")'))
    app.get('/api/employees/emp-123', (c) => c.json({ id: 'emp-123', name: 'Priya' }))
    app.get('/api/ess/payslips/latest', (c) => c.json({ netPay: 45000 }))
    app.post('/api/payroll/run', (c) => c.json({ runId: 'PR-1' }))
    app.post('/auth/login', (c) => c.json({ ok: true }))
    app.get('/api/admin/cache/status', (c) => c.json({ ok: true }))
    app.get('/api/tax/slabs/2025-2026', (c) => c.json({ slabs: [] }))
    app.get('/api/health', (c) => c.json({ ok: true }))

    return app
  }

  it('sets immutable 1-year public cache on static asset requests', async () => {
    const app = createTestApp()
    const res = await app.request('/dist/main.bundle.js')

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe(CACHE_CONTROL_HEADERS['static'])
    expect(res.headers.get('Cache-Control')).toContain('immutable')
  })

  it('sets private 60s cache on employee and ESS read endpoints', async () => {
    const app = createTestApp()
    const resEmp = await app.request('/api/employees/emp-123')
    expect(resEmp.status).toBe(200)
    expect(resEmp.headers.get('Cache-Control')).toBe(CACHE_CONTROL_HEADERS['private-short'])

    const resEss = await app.request('/api/ess/payslips/latest')
    expect(resEss.status).toBe(200)
    expect(resEss.headers.get('Cache-Control')).toBe(CACHE_CONTROL_HEADERS['private-short'])
  })

  it('sets no-store on payroll runs and auth login endpoints', async () => {
    const app = createTestApp()
    const resPay = await app.request('/api/payroll/run', { method: 'POST' })
    expect(resPay.status).toBe(200)
    expect(resPay.headers.get('Cache-Control')).toBe(CACHE_CONTROL_HEADERS['no-store'])

    const resAuth = await app.request('/auth/login', { method: 'POST' })
    expect(resAuth.status).toBe(200)
    expect(resAuth.headers.get('Cache-Control')).toBe(CACHE_CONTROL_HEADERS['no-store'])
  })

  it('sets public 1-hour cache with stale-while-revalidate on public reference APIs', async () => {
    const app = createTestApp()
    const resSlabs = await app.request('/api/tax/slabs/2025-2026')
    expect(resSlabs.status).toBe(200)
    expect(resSlabs.headers.get('Cache-Control')).toBe(CACHE_CONTROL_HEADERS['public-reference'])

    const resHealth = await app.request('/api/health')
    expect(resHealth.status).toBe(200)
    expect(resHealth.headers.get('Cache-Control')).toBe(CACHE_CONTROL_HEADERS['public-reference'])
  })
})
