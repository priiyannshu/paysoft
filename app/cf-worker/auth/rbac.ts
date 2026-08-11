import type { Context, Next } from 'hono'

export type Role = 'super_admin' | 'hr_lead' | 'payroll_accountant' | 'employee'

export interface AuthContext {
  userId: string
  orgId: string
  role: string
  email: string
  name: string
}

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext
  }
}

const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 4,
  hr_lead: 3,
  payroll_accountant: 2,
  employee: 1,
}

export function requireRole(...allowedRoles: Role[]) {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth')

    if (!auth) {
      return c.json({ error: 'Unauthorized', message: 'No active session' }, 401)
    }

    const userLevel = ROLE_HIERARCHY[auth.role as Role] || 0
    const requiredLevel = Math.min(...allowedRoles.map((r) => ROLE_HIERARCHY[r]))

    if (userLevel < requiredLevel) {
      return c.json({ error: 'Forbidden', message: 'Insufficient permissions' }, 403)
    }

    await next()
  }
}

export function requireOrg() {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth')

    if (!auth) {
      return c.json({ error: 'Unauthorized', message: 'No active session' }, 401)
    }

    await next()
  }
}
