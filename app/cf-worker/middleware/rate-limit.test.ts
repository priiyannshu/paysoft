import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { rateLimiter, authLoginLimiter, payrollRunLimiter, generalApiLimiter } from './rate-limit'
import type { KVNamespace } from '@cloudflare/workers-types'

function createMockKV(): KVNamespace {
  const store = new Map<string, string>()

  return {
    get: vi.fn(async (key: string) => store.get(key) || null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value)
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key)
    }),
  } as unknown as KVNamespace
}

describe('KV Sliding-Window Rate Limiter Middleware (Phase 8)', () => {
  let mockKV: KVNamespace

  beforeEach(() => {
    mockKV = createMockKV()
  })

  it('enforces 5 requests per 60s on auth login limiter and returns 429 on 6th request', async () => {
    const app = new Hono<{ Bindings: { KV: KVNamespace } }>()
    app.post('/auth/login', authLoginLimiter, (c) => c.json({ ok: true }))

    const env = { KV: mockKV }
    const ipHeaders = { 'cf-connecting-ip': '203.0.113.195' }

    // First 5 requests should pass
    for (let i = 1; i <= 5; i++) {
      const res = await app.request('/auth/login', { method: 'POST', headers: ipHeaders }, env)
      expect(res.status).toBe(200)
      expect(res.headers.get('X-RateLimit-Limit')).toBe('5')
      expect(Number(res.headers.get('X-RateLimit-Remaining'))).toBe(5 - i)
    }

    // 6th request within the same window must be blocked with 429
    const res6 = await app.request('/auth/login', { method: 'POST', headers: ipHeaders }, env)
    expect(res6.status).toBe(429)

    const json = await res6.json() as any
    expect(json.error).toBe('Too Many Requests')
    expect(json.retryAfter).toBeGreaterThan(0)
    expect(res6.headers.get('Retry-After')).toBeTruthy()
    expect(res6.headers.get('X-RateLimit-Remaining')).toBe('0')

    // A different IP should still be allowed
    const diffIpRes = await app.request(
      '/auth/login',
      { method: 'POST', headers: { 'cf-connecting-ip': '198.51.100.42' } },
      env
    )
    expect(diffIpRes.status).toBe(200)
  })

  it('enforces 1 request per minute per org on payroll run limiter', async () => {
    const app = new Hono<{ Bindings: { KV: KVNamespace } }>()
    app.post('/api/payroll/run', payrollRunLimiter, (c) => c.json({ status: 'started' }))

    const env = { KV: mockKV }
    const payload = JSON.stringify({ orgId: 'org_demo_001', month: 4, year: 2026 })

    // First payroll run request passes
    const res1 = await app.request(
      '/api/payroll/run',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      },
      env
    )
    expect(res1.status).toBe(200)

    // Second rapid payroll run request for same org is throttled
    const res2 = await app.request(
      '/api/payroll/run',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      },
      env
    )
    expect(res2.status).toBe(429)
    const err = await res2.json() as any
    expect(err.error).toBe('Too Many Requests')

    // A different org is allowed
    const otherOrgPayload = JSON.stringify({ orgId: 'org_other_999', month: 4, year: 2026 })
    const resOther = await app.request(
      '/api/payroll/run',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: otherOrgPayload,
      },
      env
    )
    expect(resOther.status).toBe(200)
  })

  it('allows general API requests up to the 100 req limit', async () => {
    const app = new Hono<{ Bindings: { KV: KVNamespace } }>()
    app.get('/api/test', generalApiLimiter, (c) => c.json({ data: 'ok' }))

    const env = { KV: mockKV }

    // Test a batch of 10 requests
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/api/test', {}, env)
      expect(res.status).toBe(200)
      expect(res.headers.get('X-RateLimit-Limit')).toBe('100')
    }
  })

  it('gracefully degrades and passes requests when KV is undefined', async () => {
    const app = new Hono()
    app.get('/test', authLoginLimiter, (c) => c.json({ ok: true }))

    // Request without KV in environment
    const res = await app.request('/test')
    expect(res.status).toBe(200)
  })
})
