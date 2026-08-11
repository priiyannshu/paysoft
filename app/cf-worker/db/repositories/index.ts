import { eq, and, desc, asc } from 'drizzle-orm'
import type { Db } from '../client'
import {
  organizations,
  departments,
  employees,
  salaryRecords,
  configurations,
  auditLogs,
  declarations,
  leaveRecords,
  users,
  sessions,
} from '../schema'

// ─── organizations ───────────────────────────────────────────────────────────

export function createOrganization(
  db: Db,
  data: Omit<typeof organizations.$inferInsert, 'orgId'>,
) {
  return db.insert(organizations).values(data).returning().get()
}

export function getOrganization(db: Db, id: string) {
  return db.select().from(organizations).where(eq(organizations.id, id)).get()
}

export function getOrganizationByCode(db: Db, code: string) {
  return db.select().from(organizations).where(eq(organizations.code, code)).get()
}

// ─── departments ─────────────────────────────────────────────────────────────

export function createDepartment(
  db: Db,
  orgId: string,
  data: Omit<typeof departments.$inferInsert, 'orgId'>,
) {
  return db.insert(departments).values({ ...data, orgId }).returning().get()
}

export function getDepartments(db: Db, orgId: string) {
  return db
    .select()
    .from(departments)
    .where(eq(departments.orgId, orgId))
    .orderBy(asc(departments.name))
    .all()
}

export function getDepartment(db: Db, orgId: string, id: string) {
  return db
    .select()
    .from(departments)
    .where(and(eq(departments.id, id), eq(departments.orgId, orgId)))
    .get()
}

// ─── employees ───────────────────────────────────────────────────────────────

export function createEmployee(
  db: Db,
  orgId: string,
  data: Omit<typeof employees.$inferInsert, 'orgId'>,
) {
  return db.insert(employees).values({ ...data, orgId }).returning().get()
}

export function getEmployee(db: Db, orgId: string, id: string) {
  return db
    .select()
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.orgId, orgId)))
    .get()
}

export function getEmployeeByCode(db: Db, orgId: string, code: string) {
  return db
    .select()
    .from(employees)
    .where(and(eq(employees.code, code), eq(employees.orgId, orgId)))
    .get()
}

export function getEmployees(db: Db, orgId: string, options?: { status?: string; departmentId?: string }) {
  const conditions = [eq(employees.orgId, orgId)]
  if (options?.status) {
    conditions.push(eq(employees.status, options.status))
  }
  if (options?.departmentId) {
    conditions.push(eq(employees.departmentId, options.departmentId))
  }
  return db
    .select()
    .from(employees)
    .where(and(...conditions))
    .orderBy(asc(employees.code))
    .all()
}

export function updateEmployee(
  db: Db,
  orgId: string,
  id: string,
  data: Partial<typeof employees.$inferInsert>,
) {
  return db
    .update(employees)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(employees.id, id), eq(employees.orgId, orgId)))
    .returning()
    .get()
}

// ─── salary_records ──────────────────────────────────────────────────────────

export function createSalaryRecord(
  db: Db,
  orgId: string,
  data: Omit<typeof salaryRecords.$inferInsert, 'orgId'>,
) {
  return db.insert(salaryRecords).values({ ...data, orgId }).returning().get()
}

export function getSalaryRecord(db: Db, orgId: string, id: string) {
  return db
    .select()
    .from(salaryRecords)
    .where(and(eq(salaryRecords.id, id), eq(salaryRecords.orgId, orgId)))
    .get()
}

export function getSalaryRecords(
  db: Db,
  orgId: string,
  month: number,
  year: number,
) {
  return db
    .select()
    .from(salaryRecords)
    .where(
      and(
        eq(salaryRecords.orgId, orgId),
        eq(salaryRecords.month, month),
        eq(salaryRecords.year, year),
      ),
    )
    .orderBy(asc(salaryRecords.id))
    .all()
}

export function getEmployeeSalaryHistory(
  db: Db,
  orgId: string,
  employeeId: string,
) {
  return db
    .select()
    .from(salaryRecords)
    .where(
      and(
        eq(salaryRecords.orgId, orgId),
        eq(salaryRecords.employeeId, employeeId),
      ),
    )
    .orderBy(desc(salaryRecords.year), desc(salaryRecords.month))
    .all()
}

export function updateSalaryRecordStatus(
  db: Db,
  orgId: string,
  id: string,
  status: string,
) {
  const extra: Record<string, unknown> = { status, updatedAt: new Date() }
  if (status === 'frozen') {
    extra.frozenAt = new Date()
  }
  return db
    .update(salaryRecords)
    .set(extra)
    .where(and(eq(salaryRecords.id, id), eq(salaryRecords.orgId, orgId)))
    .returning()
    .get()
}

// ─── configurations ──────────────────────────────────────────────────────────

export function setConfiguration(
  db: Db,
  orgId: string,
  key: string,
  value: string,
  description?: string,
) {
  return db
    .insert(configurations)
    .values({ orgId, key, value, description, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [configurations.orgId, configurations.key],
      set: { value, description, updatedAt: new Date() },
    })
    .returning()
    .get()
}

export function getConfiguration(db: Db, orgId: string, key: string) {
  return db
    .select()
    .from(configurations)
    .where(
      and(eq(configurations.orgId, orgId), eq(configurations.key, key)),
    )
    .get()
}

export function getConfigurations(db: Db, orgId: string) {
  return db
    .select()
    .from(configurations)
    .where(eq(configurations.orgId, orgId))
    .orderBy(asc(configurations.key))
    .all()
}

// ─── audit_logs ──────────────────────────────────────────────────────────────

export function createAuditLog(
  db: Db,
  orgId: string,
  data: Omit<typeof auditLogs.$inferInsert, 'orgId'>,
) {
  return db.insert(auditLogs).values({ ...data, orgId }).returning().get()
}

export function getAuditLogs(
  db: Db,
  orgId: string,
  options?: { action?: string; limit?: number },
) {
  const conditions = [eq(auditLogs.orgId, orgId)]
  if (options?.action) {
    conditions.push(eq(auditLogs.action, options.action))
  }
  return db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(options?.limit ?? 100)
    .all()
}

// ─── declarations ────────────────────────────────────────────────────────────

export function createDeclaration(
  db: Db,
  orgId: string,
  data: Omit<typeof declarations.$inferInsert, 'orgId'>,
) {
  return db.insert(declarations).values({ ...data, orgId }).returning().get()
}

export function getDeclaration(db: Db, orgId: string, id: string) {
  return db
    .select()
    .from(declarations)
    .where(and(eq(declarations.id, id), eq(declarations.orgId, orgId)))
    .get()
}

export function getDeclarations(
  db: Db,
  orgId: string,
  employeeId: string,
  fiscalYear?: string,
) {
  const conditions = [
    eq(declarations.orgId, orgId),
    eq(declarations.employeeId, employeeId),
  ]
  if (fiscalYear) {
    conditions.push(eq(declarations.fiscalYear, fiscalYear))
  }
  return db
    .select()
    .from(declarations)
    .where(and(...conditions))
    .orderBy(desc(declarations.createdAt))
    .all()
}

export function updateDeclarationStatus(
  db: Db,
  orgId: string,
  id: string,
  status: string,
  reviewedBy: string,
  approvedAmount?: number,
  remarks?: string,
) {
  return db
    .update(declarations)
    .set({
      status,
      reviewedBy,
      reviewedAt: new Date(),
      approvedAmount,
      remarks,
      updatedAt: new Date(),
    })
    .where(and(eq(declarations.id, id), eq(declarations.orgId, orgId)))
    .returning()
    .get()
}

// ─── leave_records ───────────────────────────────────────────────────────────

export function createLeaveRecord(
  db: Db,
  orgId: string,
  data: Omit<typeof leaveRecords.$inferInsert, 'orgId'>,
) {
  return db.insert(leaveRecords).values({ ...data, orgId }).returning().get()
}

export function getLeaveRecord(db: Db, orgId: string, id: string) {
  return db
    .select()
    .from(leaveRecords)
    .where(and(eq(leaveRecords.id, id), eq(leaveRecords.orgId, orgId)))
    .get()
}

export function getLeaveRecords(
  db: Db,
  orgId: string,
  employeeId: string,
  status?: string,
) {
  const conditions = [
    eq(leaveRecords.orgId, orgId),
    eq(leaveRecords.employeeId, employeeId),
  ]
  if (status) {
    conditions.push(eq(leaveRecords.status, status))
  }
  return db
    .select()
    .from(leaveRecords)
    .where(and(...conditions))
    .orderBy(desc(leaveRecords.createdAt))
    .all()
}

export function updateLeaveStatus(
  db: Db,
  orgId: string,
  id: string,
  status: string,
  approvedBy: string,
) {
  return db
    .update(leaveRecords)
    .set({
      status,
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(leaveRecords.id, id), eq(leaveRecords.orgId, orgId)))
    .returning()
    .get()
}

// ─── users ───────────────────────────────────────────────────────────────────

export function createUser(
  db: Db,
  orgId: string,
  data: Omit<typeof users.$inferInsert, 'orgId'>,
) {
  return db.insert(users).values({ ...data, orgId }).returning().get()
}

export function getUser(db: Db, orgId: string, id: string) {
  return db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.orgId, orgId)))
    .get()
}

export function getUserByEmail(db: Db, orgId: string, email: string) {
  return db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.orgId, orgId)))
    .get()
}

export function getUsers(db: Db, orgId: string) {
  return db
    .select()
    .from(users)
    .where(eq(users.orgId, orgId))
    .orderBy(asc(users.name))
    .all()
}

export function updateUser(
  db: Db,
  orgId: string,
  id: string,
  data: Partial<typeof users.$inferInsert>,
) {
  return db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.orgId, orgId)))
    .returning()
    .get()
}

export function updateUserLastLogin(db: Db, orgId: string, id: string) {
  return db
    .update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.orgId, orgId)))
    .returning()
    .get()
}

// ─── sessions ────────────────────────────────────────────────────────────────

export function createSession(
  db: Db,
  data: typeof sessions.$inferInsert,
) {
  return db.insert(sessions).values(data).returning().get()
}

export function getSession(db: Db, id: string) {
  return db.select().from(sessions).where(eq(sessions.id, id)).get()
}

export function deleteSession(db: Db, id: string) {
  return db.delete(sessions).where(eq(sessions.id, id)).run()
}

export function deleteUserSessions(db: Db, userId: string) {
  return db.delete(sessions).where(eq(sessions.userId, userId)).run()
}

export function updateSessionExpiration(
  db: Db,
  id: string,
  expiresAt: number,
) {
  return db
    .update(sessions)
    .set({ expiresAt })
    .where(eq(sessions.id, id))
    .returning()
    .get()
}
