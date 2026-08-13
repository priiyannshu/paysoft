import type { Context, Next } from 'hono'
import { validateSession } from '../auth/sessions'
import type { AuthContext } from '../auth/rbac'

const SESSION_COOKIE_NAME = 'session'

import { createDb } from '../db/client'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export async function authMiddleware(c: Context, next: Next) {
  const cookieHeader = c.req.header('Cookie')
  const authHeader = c.req.header('Authorization')
  const roleHeader = c.req.header('X-User-Role')
  const emailHeader = c.req.header('X-User-Email')

  let sessionId = cookieHeader ? parseSessionCookie(cookieHeader) : null
  if (!sessionId && authHeader?.startsWith('Bearer ')) {
    sessionId = authHeader.substring(7).trim()
  }

  if (sessionId) {
    const result = await validateSession(c.env.DB, sessionId)
    if (result) {
      c.set('auth', {
        userId: result.user.id,
        orgId: result.user.orgId,
        role: result.user.role,
        email: result.user.email,
        name: result.user.name,
      })
      await next()
      if (result.cookie) {
        c.header('Set-Cookie', result.cookie, { append: true })
      }
      return
    }
  }

  // Fallback demo user resolution from headers if provided
  if (roleHeader || emailHeader) {
    try {
      const db = createDb(c.env.DB)
      const userRow = emailHeader
        ? await db.select().from(users).where(eq(users.email, emailHeader)).get()
        : await db.select().from(users).where(eq(users.role, roleHeader!)).get()

      if (userRow) {
        c.set('auth', {
          userId: userRow.id,
          orgId: userRow.orgId,
          role: userRow.role,
          email: userRow.email,
          name: userRow.name,
        })
        await next()
        return
      }
    } catch {
      // ignore
    }
  }

  await next()
}

function parseSessionCookie(cookieHeader: string): string | null {
  const cookies = cookieHeader.split(';').map((c) => c.trim())
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split('=')
    if (name === 'auth_session' || name === 'session') {
      return rest.join('=')
    }
  }
  return null
}

export function getAuth(c: Context): AuthContext | null {
  return c.get('auth') ?? null
}
