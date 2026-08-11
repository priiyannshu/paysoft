import { describe, it, expect, beforeAll } from 'vitest'
import { env, applyD1Migrations } from 'cloudflare:test'
import { createDb } from '../client'
import * as repo from './index'
import { migrationQueries } from './schema-sql'
import { hashPassword } from '../../auth/password'

const TEST_ORG_ID = 'test_org_001'
const TEST_ORG_2_ID = 'test_org_002'

const USER_SESSION_MIGRATION = [
  `CREATE TABLE \`sessions\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`user_id\` text NOT NULL,
    \`org_id\` text NOT NULL,
    \`expires_at\` integer NOT NULL,
    \`created_at\` integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (\`org_id\`) REFERENCES \`organizations\`(\`id\`) ON UPDATE no action ON DELETE no action
  )`,
  `CREATE INDEX \`session_user_idx\` ON \`sessions\` (\`user_id\`)`,
  `CREATE INDEX \`session_org_idx\` ON \`sessions\` (\`org_id\`)`,
  `CREATE TABLE \`users\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`org_id\` text NOT NULL,
    \`email\` text NOT NULL,
    \`password_hash\` text NOT NULL,
    \`role\` text DEFAULT 'employee' NOT NULL,
    \`name\` text NOT NULL,
    \`status\` text DEFAULT 'active' NOT NULL,
    \`last_login_at\` integer,
    \`created_at\` integer DEFAULT (unixepoch()) NOT NULL,
    \`updated_at\` integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY (\`org_id\`) REFERENCES \`organizations\`(\`id\`) ON UPDATE no action ON DELETE no action
  )`,
  `CREATE UNIQUE INDEX \`user_org_email_idx\` ON \`users\` (\`org_id\`,\`email\`)`,
  `CREATE INDEX \`user_org_idx\` ON \`users\` (\`org_id\`)`,
]

let migrationsApplied = false

beforeAll(async () => {
  if (!migrationsApplied) {
    await applyD1Migrations(env.DB, [
      { name: '0000_init.sql', queries: migrationQueries },
      { name: '0001_users_sessions.sql', queries: USER_SESSION_MIGRATION },
    ])
    migrationsApplied = true
  }
})

async function seedTestOrg() {
  const db = createDb(env.DB)
  await repo.createOrganization(db, {
    id: TEST_ORG_ID,
    name: 'Test Org',
    code: 'TEST',
    stateCode: 'MH',
  })
  await repo.createOrganization(db, {
    id: TEST_ORG_2_ID,
    name: 'Test Org 2',
    code: 'TEST2',
    stateCode: 'KA',
  })
  const dept = await repo.createDepartment(db, TEST_ORG_ID, {
    name: 'Engineering',
    code: 'ENG',
  })
  const dept2 = await repo.createDepartment(db, TEST_ORG_2_ID, {
    name: 'Engineering',
    code: 'ENG',
  })
  return { dept, dept2 }
}

describe('organizations', () => {
  it('creates and retrieves an organization', async () => {
    const db = createDb(env.DB)
    const org = await repo.createOrganization(db, {
      id: TEST_ORG_ID,
      name: 'Test Org',
      code: 'TEST',
      stateCode: 'MH',
    })
    expect(org.id).toBe(TEST_ORG_ID)
    expect(org.name).toBe('Test Org')

    const fetched = await repo.getOrganization(db, TEST_ORG_ID)
    expect(fetched?.name).toBe('Test Org')

    const byCode = await repo.getOrganizationByCode(db, 'TEST')
    expect(byCode?.id).toBe(TEST_ORG_ID)
  })
})

describe('departments', () => {
  it('creates and lists departments scoped to org', async () => {
    const db = createDb(env.DB)
    await seedTestOrg()

    const depts = await repo.getDepartments(db, TEST_ORG_ID)
    expect(depts.length).toBe(1)
    expect(depts[0].name).toBe('Engineering')

    const dept2List = await repo.getDepartments(db, TEST_ORG_2_ID)
    expect(dept2List.length).toBe(1)
  })
})

describe('employees', () => {
  it('creates and retrieves an employee', async () => {
    const db = createDb(env.DB)
    const { dept } = await seedTestOrg()

    const emp = await repo.createEmployee(db, TEST_ORG_ID, {
      code: 'EMP001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      departmentId: dept.id,
      basicPay: 50000,
      daPercent: 8,
      hraPercent: 50,
    })
    expect(emp.code).toBe('EMP001')
    expect(emp.firstName).toBe('Rahul')

    const fetched = await repo.getEmployee(db, TEST_ORG_ID, emp.id)
    expect(fetched?.lastName).toBe('Sharma')

    const byCode = await repo.getEmployeeByCode(db, TEST_ORG_ID, 'EMP001')
    expect(byCode?.id).toBe(emp.id)
  })

  it('lists employees filtered by org and status', async () => {
    const db = createDb(env.DB)
    const { dept } = await seedTestOrg()

    await repo.createEmployee(db, TEST_ORG_ID, {
      code: 'EMP001',
      firstName: 'A',
      lastName: 'B',
      departmentId: dept.id,
      basicPay: 30000,
      daPercent: 0,
      hraPercent: 40,
    })
    await repo.createEmployee(db, TEST_ORG_ID, {
      code: 'EMP002',
      firstName: 'C',
      lastName: 'D',
      departmentId: dept.id,
      basicPay: 40000,
      daPercent: 0,
      hraPercent: 40,
      status: 'resigned',
    })

    const all = await repo.getEmployees(db, TEST_ORG_ID)
    expect(all.length).toBe(2)

    const active = await repo.getEmployees(db, TEST_ORG_ID, { status: 'active' })
    expect(active.length).toBe(1)
    expect(active[0].code).toBe('EMP001')
  })

  it('updates an employee', async () => {
    const db = createDb(env.DB)
    const { dept } = await seedTestOrg()

    const emp = await repo.createEmployee(db, TEST_ORG_ID, {
      code: 'EMP001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      departmentId: dept.id,
      basicPay: 50000,
      daPercent: 8,
      hraPercent: 50,
    })

    const updated = await repo.updateEmployee(db, TEST_ORG_ID, emp.id, {
      basicPay: 60000,
    })
    expect(updated.basicPay).toBe(60000)
  })
})

describe('cross-org isolation (RLS)', () => {
  it('employee from org A is invisible to org B', async () => {
    const db = createDb(env.DB)
    const { dept } = await seedTestOrg()

    const empA = await repo.createEmployee(db, TEST_ORG_ID, {
      code: 'EMP001',
      firstName: 'OrgA',
      lastName: 'Employee',
      departmentId: dept.id,
      basicPay: 50000,
      daPercent: 0,
      hraPercent: 40,
    })

    // Org B tries to read Org A's employee by ID
    const crossRead = await repo.getEmployee(db, TEST_ORG_2_ID, empA.id)
    expect(crossRead).toBeUndefined()

    // Org B tries to read Org A's employee by code
    const crossByCode = await repo.getEmployeeByCode(db, TEST_ORG_2_ID, 'EMP001')
    expect(crossByCode).toBeUndefined()

    // Org B's employee list is empty
    const orgBEmployees = await repo.getEmployees(db, TEST_ORG_2_ID)
    expect(orgBEmployees.length).toBe(0)
  })

  it('salary records from org A are invisible to org B', async () => {
    const db = createDb(env.DB)
    const { dept } = await seedTestOrg()

    const emp = await repo.createEmployee(db, TEST_ORG_ID, {
      code: 'EMP001',
      firstName: 'A',
      lastName: 'B',
      departmentId: dept.id,
      basicPay: 50000,
      daPercent: 0,
      hraPercent: 40,
    })

    await repo.createSalaryRecord(db, TEST_ORG_ID, {
      employeeId: emp.id,
      month: 4,
      year: 2025,
      basicPay: 50000,
      grossEarnings: 50000,
      netPay: 45000,
    })

    const orgARecords = await repo.getSalaryRecords(db, TEST_ORG_ID, 4, 2025)
    expect(orgARecords.length).toBe(1)

    const orgBRecords = await repo.getSalaryRecords(db, TEST_ORG_2_ID, 4, 2025)
    expect(orgBRecords.length).toBe(0)
  })
})

describe('configurations', () => {
  it('sets and gets configuration with upsert', async () => {
    const db = createDb(env.DB)
    await seedTestOrg()

    await repo.setConfiguration(db, TEST_ORG_ID, 'ptax_mh', '200', 'PTax')
    const cfg = await repo.getConfiguration(db, TEST_ORG_ID, 'ptax_mh')
    expect(cfg?.value).toBe('200')

    // Upsert
    await repo.setConfiguration(db, TEST_ORG_ID, 'ptax_mh', '250', 'PTax updated')
    const updated = await repo.getConfiguration(db, TEST_ORG_ID, 'ptax_mh')
    expect(updated?.value).toBe('250')

    // Only one row per key
    const all = await repo.getConfigurations(db, TEST_ORG_ID)
    const ptaxRows = all.filter((c) => c.key === 'ptax_mh')
    expect(ptaxRows.length).toBe(1)
  })
})

describe('audit_logs', () => {
  it('creates and retrieves audit logs scoped to org', async () => {
    const db = createDb(env.DB)
    await seedTestOrg()

    await repo.createAuditLog(db, TEST_ORG_ID, {
      action: 'employee.create',
      message: 'Created employee',
      severity: 'info',
      actorType: 'system',
    })

    const logs = await repo.getAuditLogs(db, TEST_ORG_ID)
    expect(logs.length).toBe(1)
    expect(logs[0].action).toBe('employee.create')

    const orgBLogs = await repo.getAuditLogs(db, TEST_ORG_2_ID)
    expect(orgBLogs.length).toBe(0)
  })
})

describe('declarations', () => {
  it('creates and retrieves declarations scoped to org', async () => {
    const db = createDb(env.DB)
    const { dept } = await seedTestOrg()

    const emp = await repo.createEmployee(db, TEST_ORG_ID, {
      code: 'EMP001',
      firstName: 'A',
      lastName: 'B',
      departmentId: dept.id,
      basicPay: 50000,
      daPercent: 0,
      hraPercent: 40,
    })

    await repo.createDeclaration(db, TEST_ORG_ID, {
      employeeId: emp.id,
      fiscalYear: '2025-26',
      type: '80c',
      amount: 150000,
    })

    const decls = await repo.getDeclarations(db, TEST_ORG_ID, emp.id)
    expect(decls.length).toBe(1)
    expect(decls[0].type).toBe('80c')

    const orgBDecls = await repo.getDeclarations(db, TEST_ORG_2_ID, emp.id)
    expect(orgBDecls.length).toBe(0)
  })
})

describe('leave_records', () => {
  it('creates and retrieves leave records scoped to org', async () => {
    const db = createDb(env.DB)
    const { dept } = await seedTestOrg()

    const emp = await repo.createEmployee(db, TEST_ORG_ID, {
      code: 'EMP001',
      firstName: 'A',
      lastName: 'B',
      departmentId: dept.id,
      basicPay: 50000,
      daPercent: 0,
      hraPercent: 40,
    })

    await repo.createLeaveRecord(db, TEST_ORG_ID, {
      employeeId: emp.id,
      type: 'casual',
      startDate: '2025-04-01',
      endDate: '2025-04-01',
      days: 1,
    })

    const leaves = await repo.getLeaveRecords(db, TEST_ORG_ID, emp.id)
    expect(leaves.length).toBe(1)
    expect(leaves[0].type).toBe('casual')

    const orgBLeaves = await repo.getLeaveRecords(db, TEST_ORG_2_ID, emp.id)
    expect(orgBLeaves.length).toBe(0)
  })
})

// ─── users & sessions ──────────────────────────────────────────────────────

async function seedTestUsers() {
  const db = createDb(env.DB)
  const passwordHash = await hashPassword('password123')

  await repo.createUser(db, TEST_ORG_ID, {
    email: 'admin@test.org',
    passwordHash,
    name: 'Admin User',
    role: 'super_admin',
  })
  await repo.createUser(db, TEST_ORG_ID, {
    email: 'hr@test.org',
    passwordHash,
    name: 'HR Lead',
    role: 'hr_lead',
  })
  await repo.createUser(db, TEST_ORG_ID, {
    email: 'employee@test.org',
    passwordHash,
    name: 'Employee User',
    role: 'employee',
  })
  await repo.createUser(db, TEST_ORG_2_ID, {
    email: 'admin@test2.org',
    passwordHash,
    name: 'Org 2 Admin',
    role: 'super_admin',
  })
}

describe('users', () => {
  it('creates and retrieves a user scoped to org', async () => {
    const db = createDb(env.DB)
    await seedTestOrg()
    await seedTestUsers()

    const user = await repo.getUserByEmail(db, TEST_ORG_ID, 'admin@test.org')
    expect(user).toBeDefined()
    expect(user?.email).toBe('admin@test.org')
    expect(user?.role).toBe('super_admin')
  })

  it('lists users scoped to org', async () => {
    const db = createDb(env.DB)
    await seedTestOrg()
    await seedTestUsers()

    const orgAUsers = await repo.getUsers(db, TEST_ORG_ID)
    expect(orgAUsers.length).toBe(3)

    const orgBUsers = await repo.getUsers(db, TEST_ORG_2_ID)
    expect(orgBUsers.length).toBe(1)
  })

  it('updates user last login', async () => {
    const db = createDb(env.DB)
    await seedTestOrg()
    await seedTestUsers()

    const user = (await repo.getUserByEmail(db, TEST_ORG_ID, 'admin@test.org'))!
    expect(user).toBeDefined()
    expect(user.lastLoginAt).toBeNull()

    await repo.updateUserLastLogin(db, TEST_ORG_ID, user.id)
    const updated = await repo.getUser(db, TEST_ORG_ID, user.id)
    expect(updated?.lastLoginAt).not.toBeNull()
  })
})

describe('cross-org isolation (users & sessions)', () => {
  it('user from org A is invisible to org B', async () => {
    const db = createDb(env.DB)
    await seedTestOrg()
    await seedTestUsers()

    const crossRead = await repo.getUserByEmail(db, TEST_ORG_2_ID, 'admin@test.org')
    expect(crossRead).toBeUndefined()

    const orgAUser = await repo.getUserByEmail(db, TEST_ORG_ID, 'admin@test.org')
    expect(orgAUser).toBeDefined()

    const crossById = await repo.getUser(db, TEST_ORG_2_ID, orgAUser!.id)
    expect(crossById).toBeUndefined()
  })

  it('enforces unique email per org', async () => {
    const db = createDb(env.DB)
    await seedTestOrg()
    await seedTestUsers()

    await expect(
      repo.createUser(db, TEST_ORG_ID, {
        email: 'admin@test.org',
        passwordHash: await hashPassword('test'),
        name: 'Duplicate',
        role: 'employee',
      }),
    ).rejects.toThrow()
  })

  it('session is scoped to user', async () => {
    const db = createDb(env.DB)
    await seedTestOrg()
    await seedTestUsers()

    const user = (await repo.getUserByEmail(db, TEST_ORG_ID, 'admin@test.org'))!
    expect(user).toBeDefined()

    const session = await repo.createSession(db, {
      id: 'test-session-id',
      userId: user.id,
      orgId: TEST_ORG_ID,
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    })
    expect(session.id).toBe('test-session-id')
    expect(session.userId).toBe(user.id)

    const fetched = await repo.getSession(db, 'test-session-id')
    expect(fetched?.userId).toBe(user!.id)

    await repo.deleteSession(db, 'test-session-id')
    const deleted = await repo.getSession(db, 'test-session-id')
    expect(deleted).toBeUndefined()
  })
})
