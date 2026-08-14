import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { LoginSchema } from '../../security/schemas'
import { verifyTurnstileToken } from '../../security/turnstile'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '../../auth/password'
import { createDb } from '../../db/client'
import { users, organizations } from '../../db/schema'
import { createUserSession, validateSession, revokeSession } from '../../auth/sessions'
import { getAuth } from '../../middleware/org-id'

export const authRoutes = new Hono<{ Bindings: Env }>()

authRoutes.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { email, password, orgCode, turnstileToken } = c.req.valid('json')

  // We check for TURNSTILE_SECRET environment variable in the env.
  // If not present, we can default to 'dummy_secret' for local dev.
  const turnstileSecret = c.env.TURNSTILE_SECRET || 'dummy_secret'
  const tokenValid = await verifyTurnstileToken(turnstileSecret, turnstileToken || '', c.req.header('CF-Connecting-IP'))
  
  if (!tokenValid) {
    return c.json({ error: 'Turnstile verification failed' }, 400)
  }
  const db = createDb(c.env.DB)

  const org = await db.select().from(organizations)
    .where(eq(organizations.code, orgCode))
    .get()

  if (!org) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const userRow = await db.select().from(users)
    .where(eq(users.email, email))
    .get()

  if (!userRow || userRow.orgId !== org.id) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const validPassword = await verifyPassword(password, userRow.passwordHash)
  if (!validPassword) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  if (userRow.status !== 'active') {
    return c.json({ error: 'Account disabled' }, 403)
  }

  const sessionCookie = await createUserSession(c.env.DB, userRow.id, userRow.orgId)

  c.header('Set-Cookie', sessionCookie)
  return c.json({
    user: {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      role: userRow.role,
      orgId: userRow.orgId,
    },
  })
})

authRoutes.post('/logout', async (c) => {
  const cookieHeader = c.req.header('Cookie')
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim())
    for (const cookie of cookies) {
      const [name, ...rest] = cookie.split('=')
      if (name === 'auth_session' || name === 'session') {
        const sessionId = rest.join('=')
        const blankCookie = await revokeSession(c.env.DB, sessionId)
        c.header('Set-Cookie', blankCookie)
        break
      }
    }
  }

  return c.json({ ok: true })
})

authRoutes.get('/me', async (c) => {
  const auth = getAuth(c)
  if (!auth) {
    return c.json({ error: 'Not authenticated' }, 401)
  }

  return c.json({
    user: {
      id: auth.userId,
      email: auth.email,
      name: auth.name,
      role: auth.role,
      orgId: auth.orgId,
    },
  })
})

authRoutes.post('/refresh', async (c) => {
  const auth = getAuth(c)
  if (!auth) {
    return c.json({ error: 'Not authenticated' }, 401)
  }

  const cookieHeader = c.req.header('Cookie')
  if (!cookieHeader) {
    return c.json({ error: 'No session cookie' }, 401)
  }

  const cookies = cookieHeader.split(';').map((c) => c.trim())
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split('=')
    if (name === 'auth_session' || name === 'session') {
      const sessionId = rest.join('=')
      const result = await validateSession(c.env.DB, sessionId)
      if (result?.cookie) {
        c.header('Set-Cookie', result.cookie)
      }
      break
    }
  }

  return c.json({ ok: true })
})
