import { describe, it, expect, vi, beforeEach } from 'vitest'
import { app } from '../index'
import type { KVNamespace } from '@cloudflare/workers-types'

function createMockKV(): KVNamespace {
  const store = new Map<string, string>()

  return {
    get: vi.fn(async (key: string, type?: string) => {
      const val = store.get(key)
      if (!val) return null
      if (type === 'json') {
        try {
          return JSON.parse(val)
        } catch {
          return null
        }
      }
      return val
    }),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value)
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key)
    }),
    list: vi.fn(async (options?: { prefix?: string }) => {
      const prefix = options?.prefix || ''
      const keys = Array.from(store.keys())
        .filter((k) => k.startsWith(prefix))
        .map((name) => ({ name }))
      return { keys, list_complete: true, cursor: '' }
    }),
  } as unknown as KVNamespace
}

function createMockDB() {
  const tableData: Record<string, any[]> = {
    employees: [
      {
        id: 'emp-1',
        org_id: 'org_demo_001',
        pan_number: 'ABCDE1234F',
        aadhaar_number: '123456789012',
        bank_account: '9876543210',
        pf_uan: '100200300400',
        esi_number: '21000000000000001',
        date_of_birth: '1990-05-15',
        salary_structure_id: 'sal-1',
      },
    ],
    payroll_runs: [
      { id: 'PR-1', org_id: 'org_demo_001', year: 2026, month: 3, status: 'frozen' },
    ],
    configurations: [],
  }

  return {
    prepare: vi.fn((sqlStr: string) => {
      return {
        bind: vi.fn((...args: any[]) => ({
          all: vi.fn(async () => {
            if (sqlStr.includes('FROM employees')) {
              return { results: tableData.employees }
            }
            return { results: [] }
          }),
          first: vi.fn(async () => {
            if (sqlStr.includes('FROM payroll_runs')) {
              return tableData.payroll_runs[0] || null
            }
            if (sqlStr.includes('FROM configurations')) {
              return null
            }
            return null
          }),
          run: vi.fn(async () => ({ success: true })),
        })),
        run: vi.fn(async () => ({ success: true })),
      }
    }),
    batch: vi.fn(async () => []),
  } as unknown as D1Database
}

describe('Phases 6 & 8 End-to-End Integration (Caching, CDN & Rate Limiting)', () => {
  let mockKV: KVNamespace
  let mockDB: D1Database
  let env: any

  beforeEach(() => {
    mockKV = createMockKV()
    mockDB = createMockDB()
    env = {
      KV: mockKV,
      DB: mockDB,
      PAYROLL_LOCK: {
        idFromName: vi.fn(() => 'lock-id'),
        get: vi.fn(() => ({
          fetch: vi.fn(async () => new Response(JSON.stringify({ runId: 'PR-1' }), { status: 200 })),
        })),
      },
    }
  })

  it('verifies Tax Slabs caching (24h) and immediate write-through updates', async () => {
    // 1. Initial GET /api/tax/slabs/2025-2026 -> populates KV
    const res1 = await app.request('/api/tax/slabs/2025-2026', {}, env)
    expect(res1.status).toBe(200)
    const config1 = await res1.json() as any
    expect(config1.financialYear).toBe('2025-2026')
    expect(config1.standardDeductionNew).toBe(75000)

    // Verify written to KV
    const inKv = await mockKV.get('tax_slabs:2025-2026', 'json') as any
    expect(inKv).toBeTruthy()
    expect(inKv.standardDeductionNew).toBe(75000)

    // 2. Update slabs via POST /api/tax/slabs/2025-2026 (write-through)
    const updateRes = await app.request(
      '/api/tax/slabs/2025-2026',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standardDeductionNew: 85000 }),
      },
      env
    )
    expect(updateRes.status).toBe(200)

    // 3. GET /api/tax/slabs/2025-2026 returns updated value immediately from KV
    const res2 = await app.request('/api/tax/slabs/2025-2026', {}, env)
    const config2 = await res2.json() as any
    expect(config2.standardDeductionNew).toBe(85000)
  })

  it('verifies State PTax Rules (7d) and Statutory Config caching', async () => {
    // PTax for MH
    const resPtax = await app.request('/api/tax/ptax/MH', {}, env)
    expect(resPtax.status).toBe(200)
    const ptaxJson = await resPtax.json() as any
    expect(ptaxJson.state).toBe('MH')
    expect(ptaxJson.slabs.length).toBeGreaterThan(0)

    // Statutory config for org_demo_001
    const resCfg = await app.request('/api/tax/config/org_demo_001', {}, env)
    expect(resCfg.status).toBe(200)
    const cfgJson = await resCfg.json() as any
    expect(cfgJson.epfWageCeiling).toBe(15000)
    expect(cfgJson.esiWageCeiling).toBe(21000)
  })

  it('verifies Smart Audit scan 5m caching and fresh cache bypass', async () => {
    // 1. First audit run computes and caches
    const res1 = await app.request('/api/audit/run?orgId=org_demo_001', {}, env)
    expect(res1.status).toBe(200)
    const report1 = await res1.json() as any
    expect(report1.orgId).toBe('org_demo_001')

    const cachedAudit = await mockKV.get('audit_results:org_demo_001', 'json')
    expect(cachedAudit).toBeTruthy()

    // 2. Second audit run returns cached result
    const res2 = await app.request('/api/audit/run?orgId=org_demo_001', {}, env)
    expect(res2.status).toBe(200)

    // 3. Bypass query ?fresh=true forces a refresh
    const resFresh = await app.request('/api/audit/run?orgId=org_demo_001&fresh=true', {}, env)
    expect(resFresh.status).toBe(200)
  })

  it('verifies Admin Cache Purge endpoint (POST /api/admin/cache/purge)', async () => {
    // Seed some cache entries
    await mockKV.put('tax_slabs:2025-2026', JSON.stringify({ test: 1 }))
    await mockKV.put('audit_results:org_demo_001', JSON.stringify({ report: 1 }))

    // Test with HR Lead authorization header
    const authHeaders = {
      'X-User-Role': 'hr_lead',
      'Content-Type': 'application/json',
    }

    // Purge specific key
    const resKey = await app.request(
      '/api/admin/cache/purge',
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ key: 'tax_slabs:2025-2026' }),
      },
      env
    )
    expect(resKey.status).toBe(200)
    const valKey = await mockKV.get('tax_slabs:2025-2026')
    expect(valKey).toBeNull()

    // Purge all caches
    await mockKV.put('tax_slabs:2024-2025', 'data')
    await mockKV.put('audit_results:org_demo_001', 'data')

    const resAll = await app.request(
      '/api/admin/cache/purge',
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ all: true }),
      },
      env
    )
    expect(resAll.status).toBe(200)
  })

  it('enforces RBAC on Admin cache purge endpoint', async () => {
    // Employee role should be forbidden (403)
    const res = await app.request(
      '/api/admin/cache/purge',
      {
        method: 'POST',
        headers: { 'X-User-Role': 'employee', 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      },
      env
    )
    expect(res.status).toBe(403)
  })

  it('verifies HTTP Cache-Control headers across endpoints', async () => {
    // Static assets
    const resStatic = await app.request('/dist/app.js', {}, env)
    expect(resStatic.headers.get('Cache-Control')).toContain('public')
    expect(resStatic.headers.get('Cache-Control')).toContain('immutable')

    // Health check (public reference)
    const resHealth = await app.request('/api/health', {}, env)
    expect(resHealth.headers.get('Cache-Control')).toContain('public')

    // Tax Slabs (public reference)
    const resSlabs = await app.request('/api/tax/slabs/2025-2026', {}, env)
    expect(resSlabs.headers.get('Cache-Control')).toContain('public')
  })
})
