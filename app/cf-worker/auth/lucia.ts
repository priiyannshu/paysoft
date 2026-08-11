import { Lucia } from 'lucia'
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle'
import { drizzle } from 'drizzle-orm/d1'
import { sessions, users } from '../db/schema'

export function createLucia(d1: D1Database) {
  const db = drizzle(d1, { schema: { users, sessions } })
  const adapter = new DrizzleSQLiteAdapter(db as never, sessions, users)

  return new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: true,
        sameSite: 'lax',
        path: '/',
      },
      expires: false,
    },
    getUserAttributes: (attributes) => ({
      id: attributes.id,
      orgId: attributes.orgId,
      email: attributes.email,
      role: attributes.role,
      name: attributes.name,
      status: attributes.status,
    }),
  })
}

export type LuciaAuth = ReturnType<typeof createLucia>

declare module 'lucia' {
  interface Register {
    Lucia: LuciaAuth
    DatabaseUserAttributes: {
      id: string
      orgId: string
      email: string
      role: string
      name: string
      status: string
    }
  }
}
