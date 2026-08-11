import type { Context, Next } from 'hono'
import { validateSession } from '../auth/sessions'
import type { AuthContext } from '../auth/rbac'

const SESSION_COOKIE_NAME = 'session'

export async function authMiddleware(c: Context, next: Next) {
  const cookieHeader = c.req.header('Cookie')
  if (!cookieHeader) {
    await next()
    return
  }

  const sessionId = parseSessionCookie(cookieHeader)
  if (!sessionId) {
    await next()
    return
  }

  const result = await validateSession(c.env.DB, sessionId)
  if (!result) {
    await next()
    return
  }

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
}

function parseSessionCookie(cookieHeader: string): string | null {
  const cookies = cookieHeader.split(';').map((c) => c.trim())
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split('=')
    if (name === SESSION_COOKIE_NAME) {
      return rest.join('=')
    }
  }
  return null
}

export function getAuth(c: Context): AuthContext | null {
  return c.get('auth') ?? null
}
