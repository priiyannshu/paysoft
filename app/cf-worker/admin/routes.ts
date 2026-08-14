import { Hono } from 'hono'
import { requireRole } from '../auth/rbac'
import { invalidateCache, invalidatePrefix, CACHE_KEYS } from '../cache/kv'

interface AdminEnv {
  Bindings: {
    DB: D1Database
    KV?: KVNamespace
  }
}

export const adminRoutes = new Hono<AdminEnv>()

// Restrict all /admin routes to super_admin and hr_lead
adminRoutes.use('*', requireRole('super_admin', 'hr_lead'))

/**
 * POST /api/admin/cache/purge
 *
 * Purges KV cache keys by explicit key, prefix, orgId, or clears all cache tiers.
 */
adminRoutes.post('/cache/purge', async (c) => {
  const body = await c.req.json<any>().catch(() => ({} as any))

  const { key, prefix, orgId, all } = body
  let purgedCount = 0

  if (all) {
    const defaultPrefixes = [
      'tax_slabs:',
      'ptax_rules:',
      'statutory_config:',
      'audit_results:',
      'session:',
      'ratelimit:',
    ]
    for (const p of defaultPrefixes) {
      purgedCount += await invalidatePrefix(c.env.KV, p)
    }
    return c.json({
      ok: true,
      message: 'All application caches purged successfully',
      purgedCount,
      all: true,
    })
  }

  if (prefix) {
    purgedCount = await invalidatePrefix(c.env.KV, prefix)
    return c.json({
      ok: true,
      message: `Purged keys for prefix: ${prefix}`,
      purgedCount,
      prefix,
    })
  }

  if (key) {
    await invalidateCache(c.env.KV, key)
    return c.json({
      ok: true,
      message: `Purged cache key: ${key}`,
      key,
    })
  }

  if (orgId) {
    await invalidateCache(c.env.KV, CACHE_KEYS.auditResults(orgId))
    await invalidateCache(c.env.KV, CACHE_KEYS.statutoryConfig(orgId))
    return c.json({
      ok: true,
      message: `Purged cache for organization: ${orgId}`,
      orgId,
    })
  }

  return c.json(
    { error: 'Bad Request', message: 'Specify "key", "prefix", "orgId", or "all: true" in request body' },
    400
  )
})

/**
 * GET /api/admin/cache/status
 *
 * Returns status and active cache configuration info.
 */
adminRoutes.get('/cache/status', async (c) => {
  const kvAvailable = !!c.env.KV
  return c.json({
    kvAvailable,
    cacheTiers: {
      tier1_browser: 'Cache-Control headers (private, max-age=60 / immutable)',
      tier2_cdn: 'Cloudflare Edge CDN',
      tier3_kv: 'Cloudflare KV (tax slabs 24h, ptax 7d, config 7d, audit 5m, sessions 24h)',
      tier4_d1: 'Cloudflare D1 Database',
    },
  })
})

/**
 * GET /api/admin/audit-logs
 *
 * Exposes audit logs with filtering for the Admin Audit Viewer UI.
 */
adminRoutes.get('/audit-logs', async (c) => {
  const auth = c.get('auth') as any
  const orgId = auth?.orgId || c.req.query('orgId') || 'org_demo_001'
  
  const eventType = c.req.query('eventType')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  const userId = c.req.query('userId')
  const limit = parseInt(c.req.query('limit') || '50', 10)
  const offset = parseInt(c.req.query('offset') || '0', 10)

  let query = `SELECT * FROM audit_logs WHERE org_id = ?`
  const params: any[] = [orgId]

  if (eventType) {
    query += ` AND action = ?` 
    params.push(eventType)
  }
  if (userId) {
    query += ` AND actor_id = ?`
    params.push(userId)
  }
  if (startDate) {
    query += ` AND created_at >= ?`
    params.push(startDate)
  }
  if (endDate) {
    query += ` AND created_at <= ?`
    params.push(endDate)
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ data: results, limit, offset })
})
