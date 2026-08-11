import { sql } from 'drizzle-orm'
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

// ─── organizations ───────────────────────────────────────────────────────────

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  code: text('code').notNull(),
  address: text('address'),
  stateCode: text('state_code').notNull().default('MH'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  orgCodeIdx: uniqueIndex('org_code_idx').on(t.code),
}))

// ─── departments ─────────────────────────────────────────────────────────────

export const departments = sqliteTable('departments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id')
    .notNull()
    .references(() => organizations.id),
  name: text('name').notNull(),
  code: text('code'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  deptOrgIdx: index('dept_org_idx').on(t.orgId),
  deptOrgCodeIdx: uniqueIndex('dept_org_code_idx').on(t.orgId, t.code),
}))

// ─── employees ───────────────────────────────────────────────────────────────

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id')
    .notNull()
    .references(() => organizations.id),
  departmentId: text('department_id').references(() => departments.id),
  code: text('code').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  dateOfBirth: text('date_of_birth'),
  gender: text('gender'),
  panNumber: text('pan_number'),
  aadhaarNumber: text('aadhaar_number'),
  pfUan: text('pf_uan'),
  esiNumber: text('esi_number'),
  dateOfJoining: text('date_of_joining'),
  dateOfAppointment: text('date_of_appointment'),
  dateOfResignation: text('date_of_resignation'),
  status: text('status').notNull().default('active'),
  basicPay: real('basic_pay').notNull().default(0),
  daPercent: real('da_percent').notNull().default(0),
  hraPercent: real('hra_percent').notNull().default(0),
  allowances: text('allowances'),
  bankName: text('bank_name'),
  bankAccount: text('bank_account'),
  bankIfsc: text('bank_ifsc'),
  taxRegime: text('tax_regime').notNull().default('new'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  empOrgDeptIdx: index('emp_org_dept_idx').on(t.orgId, t.departmentId),
  empOrgStatusIdx: index('emp_org_status_idx').on(t.orgId, t.status),
  empOrgCodeIdx: uniqueIndex('emp_org_code_idx').on(t.orgId, t.code),
}))

// ─── salary_records ──────────────────────────────────────────────────────────

export const salaryRecords = sqliteTable('salary_records', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id')
    .notNull()
    .references(() => organizations.id),
  employeeId: text('employee_id')
    .notNull()
    .references(() => employees.id),
  departmentId: text('department_id').references(() => departments.id),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  status: text('status').notNull().default('draft'),
  basicPay: real('basic_pay').notNull().default(0),
  da: real('da').notNull().default(0),
  hra: real('hra').notNull().default(0),
  allowances: text('allowances'),
  grossEarnings: real('gross_earnings').notNull().default(0),
  tds: real('tds').notNull().default(0),
  pfEmployee: real('pf_employee').notNull().default(0),
  pfEmployer: real('pf_employer').notNull().default(0),
  pfEps: real('pf_eps').notNull().default(0),
  esiEmployee: real('esi_employee').notNull().default(0),
  esiEmployer: real('esi_employer').notNull().default(0),
  professionalTax: real('professional_tax').notNull().default(0),
  totalDeductions: real('total_deductions').notNull().default(0),
  netPay: real('net_pay').notNull().default(0),
  runId: text('run_id'),
  frozenAt: integer('frozen_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  srOrgMonthYearIdx: index('sr_org_month_year_idx').on(t.orgId, t.month, t.year),
  srOrgEmployeeIdx: index('sr_org_employee_idx').on(t.orgId, t.employeeId),
  srUniqueIdx: uniqueIndex('sr_org_emp_month_year_idx').on(
    t.orgId,
    t.employeeId,
    t.month,
    t.year,
  ),
}))

// ─── configurations ──────────────────────────────────────────────────────────

export const configurations = sqliteTable('configurations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id')
    .notNull()
    .references(() => organizations.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  configOrgKeyIdx: uniqueIndex('config_org_key_idx').on(t.orgId, t.key),
}))

// ─── audit_logs ──────────────────────────────────────────────────────────────

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id')
    .notNull()
    .references(() => organizations.id),
  actorId: text('actor_id'),
  actorType: text('actor_type').notNull().default('system'),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  severity: text('severity').notNull().default('info'),
  message: text('message').notNull(),
  metadata: text('metadata'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  auditOrgCreatedIdx: index('audit_org_created_idx').on(t.orgId, t.createdAt),
  auditOrgActionIdx: index('audit_org_action_idx').on(t.orgId, t.action),
}))

// ─── declarations ────────────────────────────────────────────────────────────

export const declarations = sqliteTable('declarations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id')
    .notNull()
    .references(() => organizations.id),
  employeeId: text('employee_id')
    .notNull()
    .references(() => employees.id),
  fiscalYear: text('fiscal_year').notNull(),
  type: text('type').notNull(),
  amount: real('amount').notNull().default(0),
  approvedAmount: real('approved_amount'),
  status: text('status').notNull().default('pending'),
  proofUrl: text('proof_url'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  remarks: text('remarks'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  declOrgEmpFyIdx: index('decl_org_emp_fy_idx').on(t.orgId, t.employeeId, t.fiscalYear),
  declOrgStatusIdx: index('decl_org_status_idx').on(t.orgId, t.status),
}))

// ─── leave_records ───────────────────────────────────────────────────────────

export const leaveRecords = sqliteTable('leave_records', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id')
    .notNull()
    .references(() => organizations.id),
  employeeId: text('employee_id')
    .notNull()
    .references(() => employees.id),
  type: text('type').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  days: real('days').notNull().default(0),
  reason: text('reason'),
  status: text('status').notNull().default('pending'),
  approvedBy: text('approved_by'),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  leaveOrgEmpStatusIdx: index('leave_org_emp_status_idx').on(t.orgId, t.employeeId, t.status),
  leaveOrgStatusIdx: index('leave_org_status_idx').on(t.orgId, t.status),
}))

// ─── users ───────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text('org_id')
    .notNull()
    .references(() => organizations.id),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('employee'),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  userOrgEmailIdx: uniqueIndex('user_org_email_idx').on(t.orgId, t.email),
  userOrgIdx: index('user_org_idx').on(t.orgId),
}))

// ─── sessions ────────────────────────────────────────────────────────────────

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  orgId: text('org_id')
    .notNull()
    .references(() => organizations.id),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (t) => ({
  sessionUserIdx: index('session_user_idx').on(t.userId),
  sessionOrgIdx: index('session_org_idx').on(t.orgId),
}))

// ─── Inferred types ──────────────────────────────────────────────────────────

export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
export type Department = typeof departments.$inferSelect
export type NewDepartment = typeof departments.$inferInsert
export type Employee = typeof employees.$inferSelect
export type NewEmployee = typeof employees.$inferInsert
export type SalaryRecord = typeof salaryRecords.$inferSelect
export type NewSalaryRecord = typeof salaryRecords.$inferInsert
export type Configuration = typeof configurations.$inferSelect
export type NewConfiguration = typeof configurations.$inferInsert
export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
export type Declaration = typeof declarations.$inferSelect
export type NewDeclaration = typeof declarations.$inferInsert
export type LeaveRecord = typeof leaveRecords.$inferSelect
export type NewLeaveRecord = typeof leaveRecords.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
