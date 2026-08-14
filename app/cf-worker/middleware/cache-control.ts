import type { Context, Next } from 'hono'

export type CacheControlPolicy = 'static' | 'private-short' | 'no-store' | 'public-reference'

export const CACHE_CONTROL_HEADERS: Record<CacheControlPolicy, string> = {
  'static': 'public, max-age=31536000, immutable',
  'private-short': 'private, max-age=60',
  'no-store': 'no-store, no-cache, must-revalidate',
  'public-reference': 'public, max-age=3600, stale-while-revalidate=86400',
}

/**
 * Determine the appropriate Cache-Control policy based on the HTTP method and request URL path.
 */
export function getCacheControlPolicy(method: string, path: string): CacheControlPolicy {
  const upperMethod = method.toUpperCase()

  // 1. All mutating requests must never be stored in cache
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(upperMethod)) {
    return 'no-store'
  }

  // 2. Auth routes and sensitive endpoints
  if (
    path.startsWith('/auth') ||
    path.startsWith('/api/payroll/run') ||
    path.startsWith('/api/payroll/freeze') ||
    path.startsWith('/api/admin') ||
    path.startsWith('/api/notify')
  ) {
    return 'no-store'
  }

  // 3. Static asset files (hashed scripts, styles, fonts, images)
  if (
    path.startsWith('/dist') ||
    /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico|wasm)$/i.test(path)
  ) {
    return 'static'
  }

  // 4. Employee-specific & personal data read routes
  if (
    path.startsWith('/api/employees') ||
    path.startsWith('/api/ess') ||
    path.startsWith('/api/annual-statement') ||
    path.startsWith('/api/audit/status')
  ) {
    return 'private-short'
  }

  // 5. Public reference APIs (tax slabs, ptax tables, health)
  if (
    path.startsWith('/api/tax/slabs') ||
    path.startsWith('/api/tax/ptax') ||
    path === '/api/health' ||
    path === '/api/version'
  ) {
    return 'public-reference'
  }

  // 6. Default for other GET API routes (e.g. org/current, salary-stats, dashboard stats)
  if (path.startsWith('/api')) {
    return 'private-short'
  }

  // Default fallback
  return 'no-store'
}

/**
 * Cache-Control middleware for Hono.
 * Automatically inspects the route and sets standard RFC-compliant Cache-Control headers.
 */
export async function cacheControlMiddleware(c: Context, next: Next) {
  await next()

  // Do not overwrite if the route handler explicitly set custom Cache-Control
  if (!c.res.headers.has('Cache-Control')) {
    const policy = getCacheControlPolicy(c.req.method, c.req.path)
    c.header('Cache-Control', CACHE_CONTROL_HEADERS[policy])
  }
}
