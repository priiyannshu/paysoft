import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCached, setCache, invalidateCache, invalidatePrefix, CACHE_KEYS, CACHE_TTLS } from './kv'
import type { KVNamespace } from '@cloudflare/workers-types'

function createMockKV(): KVNamespace {
  const store = new Map<string, { value: string; options?: any }>()

  return {
    get: vi.fn(async (key: string, type?: string) => {
      const item = store.get(key)
      if (!item) return null
      if (type === 'json') {
        try {
          return JSON.parse(item.value)
        } catch {
          return null
        }
      }
      return item.value
    }),
    put: vi.fn(async (key: string, value: string, options?: any) => {
      store.set(key, { value, options })
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

describe('KV Cache-Aside & Invalidation Module (Phase 6)', () => {
  let mockKV: KVNamespace

  beforeEach(() => {
    mockKV = createMockKV()
  })

  it('invokes fetcher on cache miss and writes result to KV with TTL', async () => {
    const key = CACHE_KEYS.taxSlabs('2025-2026')
    const fetcher = vi.fn(async () => ({ slabs: [{ from: 0, to: 400000, rate: 0 }] }))

    const result = await getCached(mockKV, key, CACHE_TTLS.TAX_SLABS, fetcher)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ slabs: [{ from: 0, to: 400000, rate: 0 }] })
    expect(mockKV.put).toHaveBeenCalledWith(
      key,
      JSON.stringify({ slabs: [{ from: 0, to: 400000, rate: 0 }] }),
      { expirationTtl: 86400 }
    )
  })

  it('returns cached value on cache hit without invoking fetcher', async () => {
    const key = CACHE_KEYS.ptaxRules('MH')
    const initialData = [{ from: 0, to: 7500, tax: 0 }, { from: 7501, to: 999999, tax: 200 }]

    // Seed cache
    await setCache(mockKV, key, initialData, CACHE_TTLS.PTAX_RULES)

    const fetcher = vi.fn(async () => [{ from: 0, to: 10000, tax: 50 }])

    const result = await getCached(mockKV, key, CACHE_TTLS.PTAX_RULES, fetcher)

    expect(fetcher).not.toHaveBeenCalled()
    expect(result).toEqual(initialData)
  })

  it('invalidates specific cache key and triggers fresh fetch', async () => {
    const key = CACHE_KEYS.auditResults('org_demo_001')
    let counter = 1
    const fetcher = vi.fn(async () => ({ reportId: `REP-${counter++}` }))

    // 1st call: Miss -> REP-1
    const res1 = await getCached(mockKV, key, CACHE_TTLS.AUDIT_RESULTS, fetcher)
    expect(res1).toEqual({ reportId: 'REP-1' })
    expect(fetcher).toHaveBeenCalledTimes(1)

    // 2nd call: Hit -> REP-1
    const res2 = await getCached(mockKV, key, CACHE_TTLS.AUDIT_RESULTS, fetcher)
    expect(res2).toEqual({ reportId: 'REP-1' })
    expect(fetcher).toHaveBeenCalledTimes(1)

    // Invalidate
    await invalidateCache(mockKV, key)

    // 3rd call: Miss after invalidation -> REP-2
    const res3 = await getCached(mockKV, key, CACHE_TTLS.AUDIT_RESULTS, fetcher)
    expect(res3).toEqual({ reportId: 'REP-2' })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('purges all keys under a prefix with invalidatePrefix', async () => {
    await setCache(mockKV, 'tax_slabs:2024-2025', { fy: '2024-2025' })
    await setCache(mockKV, 'tax_slabs:2025-2026', { fy: '2025-2026' })
    await setCache(mockKV, 'ptax_rules:MH', { state: 'MH' })

    const count = await invalidatePrefix(mockKV, 'tax_slabs:')
    expect(count).toBe(2)

    const slab1 = await mockKV.get('tax_slabs:2024-2025')
    const slab2 = await mockKV.get('tax_slabs:2025-2026')
    const ptax = await mockKV.get('ptax_rules:MH')

    expect(slab1).toBeNull()
    expect(slab2).toBeNull()
    expect(ptax).not.toBeNull()
  })

  it('gracefully degrades when KV is undefined', async () => {
    const fetcher = vi.fn(async () => ({ test: 'data' }))

    const result = await getCached(undefined, 'any_key', 300, fetcher)
    expect(result).toEqual({ test: 'data' })
    expect(fetcher).toHaveBeenCalledTimes(1)

    // Should not throw
    await expect(setCache(undefined, 'key', { test: 1 })).resolves.toBeUndefined()
    await expect(invalidateCache(undefined, 'key')).resolves.toBeUndefined()
    await expect(invalidatePrefix(undefined, 'prefix:')).resolves.toBe(0)
  })
})
