import type { KVNamespace } from '@cloudflare/workers-types'

export const CACHE_TTLS = {
  TAX_SLABS: 86400, // 24 hours
  PTAX_RULES: 604800, // 7 days
  STATUTORY_CONFIG: 604800, // 7 days
  AUDIT_RESULTS: 300, // 5 minutes
  SESSION: 86400, // 24 hours
  RATE_LIMIT: 120, // 2 minutes
} as const

export const CACHE_KEYS = {
  taxSlabs: (fy: string) => `tax_slabs:${fy}`,
  ptaxRules: (state: string) => `ptax_rules:${state.toUpperCase()}`,
  statutoryConfig: (orgId: string) => `statutory_config:${orgId}`,
  auditResults: (orgId: string) => `audit_results:${orgId}`,
  session: (sessionId: string) => `session:${sessionId}`,
  rateLimit: (key: string, windowIndex: number) => `ratelimit:${key}:${windowIndex}`,
} as const

/**
 * Type-safe KV cache-aside helper.
 * Checks KV first; on miss, invokes fetcher and populates KV with specified TTL.
 */
export async function getCached<T>(
  kv: KVNamespace | undefined | null,
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!kv) {
    return await fetcher()
  }

  try {
    const cached = await kv.get(key, 'json')
    if (cached !== null && cached !== undefined) {
      return cached as T
    }
  } catch (err) {
    console.warn(`[KV Cache] Read error for key "${key}":`, err)
  }

  const fresh = await fetcher()

  if (fresh !== undefined && fresh !== null) {
    try {
      const expirationTtl = Math.max(60, ttlSeconds)
      await kv.put(key, JSON.stringify(fresh), { expirationTtl })
    } catch (err) {
      console.warn(`[KV Cache] Write error for key "${key}":`, err)
    }
  }

  return fresh
}

/**
 * Set cache value directly (write-through).
 */
export async function setCache<T>(
  kv: KVNamespace | undefined | null,
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> {
  if (!kv) return

  try {
    const options: { expirationTtl?: number } = {}
    if (ttlSeconds && ttlSeconds >= 60) {
      options.expirationTtl = ttlSeconds
    }
    await kv.put(key, JSON.stringify(value), options)
  } catch (err) {
    console.warn(`[KV Cache] Direct write error for key "${key}":`, err)
  }
}

/**
 * Delete a specific key from KV cache.
 */
export async function invalidateCache(
  kv: KVNamespace | undefined | null,
  key: string
): Promise<void> {
  if (!kv) return

  try {
    await kv.delete(key)
  } catch (err) {
    console.warn(`[KV Cache] Invalidation error for key "${key}":`, err)
  }
}

/**
 * Purge all keys starting with prefix from KV cache.
 */
export async function invalidatePrefix(
  kv: KVNamespace | undefined | null,
  prefix: string
): Promise<number> {
  if (!kv) return 0

  try {
    const list = await kv.list({ prefix })
    if (!list.keys || list.keys.length === 0) return 0

    await Promise.all(list.keys.map((k) => kv.delete(k.name)))
    return list.keys.length
  } catch (err) {
    console.warn(`[KV Cache] Prefix invalidation error for prefix "${prefix}":`, err)
    return 0
  }
}
