import { createLucia } from './lucia'
import { createSession, updateSessionExpiration } from '../db/repositories'
import { createDb } from '../db/client'
import { setCache, invalidateCache, CACHE_KEYS, CACHE_TTLS } from '../cache/kv'
import type { KVNamespace } from '@cloudflare/workers-types'

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7 // 7 days
const REFRESH_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 3 // refresh if < 3 days left

export interface SessionUser {
  id: string
  orgId: string
  email: string
  role: string
  name: string
  status: string
}

export async function createUserSession(
  d1: D1Database,
  userId: string,
  orgId: string,
  _kv?: KVNamespace
): Promise<string> {
  const db = createDb(d1)
  const lucia = createLucia(d1)
  const sessionId = crypto.randomUUID()
  const expiresAt = Math.floor((Date.now() + SESSION_DURATION_MS) / 1000)

  await createSession(db, {
    id: sessionId,
    userId,
    orgId,
    expiresAt,
  })

  const session = lucia.createSessionCookie(sessionId)
  return session.serialize()
}

export async function validateSession(
  d1: D1Database,
  sessionId: string,
  kv?: KVNamespace
): Promise<{ user: SessionUser; cookie: string | null } | null> {
  const key = CACHE_KEYS.session(sessionId)

  // 1. Check KV cache for session
  if (kv) {
    try {
      const cachedUser = await kv.get(key, 'json') as SessionUser | null
      if (cachedUser) {
        return { user: cachedUser, cookie: null }
      }
    } catch {
      // ignore
    }
  }

  // 2. Validate via Lucia / D1 on cache miss
  const lucia = createLucia(d1)
  const { session, user } = await lucia.validateSession(sessionId)

  if (!session || !user) return null

  let cookie: string | null = null

  if (session.fresh) {
    const newCookie = lucia.createSessionCookie(session.id)
    cookie = newCookie.serialize()
  } else if (session.expiresAt.getTime() - Date.now() < REFRESH_THRESHOLD_MS) {
    const newExpiresAt = Math.floor((Date.now() + SESSION_DURATION_MS) / 1000)
    await updateSessionExpiration(createDb(d1), session.id, newExpiresAt)
    const newCookie = lucia.createSessionCookie(session.id)
    cookie = newCookie.serialize()
  }

  const sessionUser: SessionUser = {
    id: user.id,
    orgId: user.orgId,
    email: user.email,
    role: user.role,
    name: user.name,
    status: user.status,
  }

  // Store in KV cache for quick subsequent lookups
  if (kv) {
    await setCache(kv, key, sessionUser, CACHE_TTLS.SESSION)
  }

  return {
    user: sessionUser,
    cookie,
  }
}

export async function revokeSession(
  d1: D1Database,
  sessionId: string,
  kv?: KVNamespace
): Promise<string> {
  if (kv) {
    await invalidateCache(kv, CACHE_KEYS.session(sessionId))
  }
  const lucia = createLucia(d1)
  await lucia.invalidateSession(sessionId)
  const blankCookie = lucia.createBlankSessionCookie()
  return blankCookie.serialize()
}

export async function revokeAllUserSessions(
  d1: D1Database,
  userId: string,
  _kv?: KVNamespace
): Promise<void> {
  const lucia = createLucia(d1)
  await lucia.invalidateUserSessions(userId)
}
