import type { Context, Next } from 'hono'
import type { KVNamespace } from '@cloudflare/workers-types'
import { getAuth } from './org-id'

export interface RateLimitOptions {
  windowSeconds: number
  maxRequests: number
  keyGenerator: (c: Context) => string | Promise<string>
  message?: string
}

/**
 * Distributed sliding-window rate limiter middleware backed by Cloudflare KV.
 * Implements RFC-compliant 429 Too Many Requests responses and standard rate limit headers.
 */
export function rateLimiter(options: RateLimitOptions) {
  return async (c: Context, next: Next) => {
    const kv = (c.env as any)?.KV as KVNamespace | undefined
    if (!kv) {
      return await next() // Graceful degradation if KV is unconfigured
    }

    try {
      const generatedKey = await options.keyGenerator(c)
      const key = `ratelimit:${generatedKey}`
      const now = Math.floor(Date.now() / 1000)
      const windowIndex = Math.floor(now / options.windowSeconds)
      const currentWindowKey = `${key}:${windowIndex}`
      const prevWindowKey = `${key}:${windowIndex - 1}`

      // Fetch current and previous bucket counts in parallel
      const [currentCountStr, prevCountStr] = await Promise.all([
        kv.get(currentWindowKey),
        kv.get(prevWindowKey),
      ])

      const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0
      const prevCount = prevCountStr ? parseInt(prevCountStr, 10) : 0

      // Calculate sliding window counter
      const timeIntoWindow = now % options.windowSeconds
      const prevWeight = 1 - (timeIntoWindow / options.windowSeconds)
      const slidingCount = Math.floor(prevCount * prevWeight) + currentCount

      if (slidingCount >= options.maxRequests) {
        const retryAfter = Math.max(1, options.windowSeconds - timeIntoWindow)
        c.header('Retry-After', retryAfter.toString())
        c.header('X-RateLimit-Limit', options.maxRequests.toString())
        c.header('X-RateLimit-Remaining', '0')
        c.header('X-RateLimit-Reset', (now + retryAfter).toString())

        return c.json(
          {
            error: 'Too Many Requests',
            message: options.message || 'Rate limit exceeded. Please try again later.',
            retryAfter,
          },
          429
        )
      }

      // Increment counter in current window
      await kv.put(currentWindowKey, (currentCount + 1).toString(), {
        expirationTtl: Math.max(60, options.windowSeconds * 2),
      })

      const remaining = Math.max(0, options.maxRequests - slidingCount - 1)
      const resetTime = (windowIndex + 1) * options.windowSeconds

      c.header('X-RateLimit-Limit', options.maxRequests.toString())
      c.header('X-RateLimit-Remaining', remaining.toString())
      c.header('X-RateLimit-Reset', resetTime.toString())

      return await next()
    } catch (err) {
      console.warn('[RateLimiter] Error during rate limit check, passing through:', err)
      return await next()
    }
  }
}

/**
 * Pre-configured rate limiters per architecture blueprint
 */

/** Auth login limiter: 5 requests / 60 seconds per IP */
export const authLoginLimiter = rateLimiter({
  windowSeconds: 60,
  maxRequests: 5,
  message: 'Too many login attempts. Please wait before retrying.',
  keyGenerator: (c: Context) => {
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-real-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      'anon'
    return `auth:login:${ip}`
  },
})

/** Payroll run limiter: 1 request / 60 seconds per orgId */
export const payrollRunLimiter = rateLimiter({
  windowSeconds: 60,
  maxRequests: 1,
  message: 'A payroll calculation is already being requested for this organization.',
  keyGenerator: async (c: Context) => {
    const auth = getAuth(c)
    if (auth?.orgId) return `payroll:run:${auth.orgId}`

    const queryOrg = c.req.query('orgId')
    if (queryOrg) return `payroll:run:${queryOrg}`

    // If POST with JSON body containing orgId
    try {
      const cloned = c.req.raw.clone()
      const body = await cloned.json() as any
      if (body?.orgId) return `payroll:run:${body.orgId}`
    } catch {
      // ignore
    }

    return `payroll:run:default`
  },
})

/** General API limiter: 100 requests / 60 seconds per authenticated user or IP */
export const generalApiLimiter = rateLimiter({
  windowSeconds: 60,
  maxRequests: 100,
  message: 'API rate limit exceeded. Please slow down your requests.',
  keyGenerator: (c: Context) => {
    const auth = getAuth(c)
    if (auth?.userId) return `api:user:${auth.userId}`

    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-real-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      'anon'
    return `api:ip:${ip}`
  },
})
