import { describe, it, expect, vi } from 'vitest'
import { app } from '../../index'
import { updateSalaryRecord, updateSalaryRecordStatus } from '../../db/repositories'

describe('Payroll Freeze Immutability & Lockdown Suite', () => {
  const TEST_ORG_ID = 'org_freeze_test'
  const FROZEN_YEAR = 2026
  const FROZEN_MONTH = 7
  const UN_FROZEN_MONTH = 8

  const mockFrozenRun = {
    id: `PR-${TEST_ORG_ID}-${FROZEN_YEAR}-07-1770000000`,
    org_id: TEST_ORG_ID,
    year: FROZEN_YEAR,
    month: FROZEN_MONTH,
    status: 'frozen',
  }

  const mockFrozenSalaryRecord = {
    id: 'sr_freeze_001',
    org_id: TEST_ORG_ID,
    employee_id: 'emp_001',
    month: FROZEN_MONTH,
    year: FROZEN_YEAR,
    status: 'frozen',
    basic_pay: 60000,
    gross_earnings: 75000,
    net_pay: 68000,
    deductions_json: JSON.stringify({ tds: 5000, epf: 1800, ptax: 200 }),
  }

  const createMockEnv = (overrides?: any) => {
    return {
      DB: {
        prepare: vi.fn((query: string) => ({
          bind: vi.fn((...params: any[]) => ({
            first: vi.fn(async () => {
              if (query.includes('payroll_runs') && params.includes(FROZEN_MONTH)) {
                return mockFrozenRun
              }
              if (query.includes('salary_records') && params.includes('sr_freeze_001')) {
                return mockFrozenSalaryRecord
              }
              return null
            }),
            all: vi.fn(async () => ({ results: [] })),
            run: vi.fn(async () => ({ success: true })),
          })),
        })),
      },
      PAYROLL_LOCK: {
        idFromName: vi.fn(() => 'lock_id_001'),
        get: vi.fn(() => ({
          fetch: vi.fn(async (req: Request) => {
            const url = new URL(req.url)
            if (url.pathname === '/acquire') {
              // Return 409 if month is frozen in DO
              return new Response(JSON.stringify({ error: 'Month is frozen and immutable' }), { status: 409 })
            }
            return new Response(JSON.stringify({ status: 'frozen' }))
          }),
        })),
      },
      KV: {
        get: vi.fn(async () => null),
        put: vi.fn(async () => {}),
        delete: vi.fn(async () => {}),
      },
      ...overrides,
    } as any
  }

  // ─── Test 1: Attempt POST /api/payroll/run for frozen month ──────────────
  it('Test 1: rejects POST /api/payroll/run for frozen month with 409 Conflict', async () => {
    const env = createMockEnv()

    const res = await app.fetch(
      new Request('https://paysoft.local/api/payroll/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-org-id': TEST_ORG_ID,
        },
        body: JSON.stringify({
          orgId: TEST_ORG_ID,
          month: FROZEN_MONTH,
          year: FROZEN_YEAR,
          employees: [
            {
              employeeId: 'emp_001',
              basicPay: 60000,
              daPercent: 0,
              hraPercent: 40,
              workedDays: 30,
              totalMonthDays: 30,
              taxRegime: 'new',
            },
          ],
        }),
      }),
      env
    )

    expect(res.status).toBe(409)
    const body = await res.json() as any
    expect(body.error).toMatch(/frozen and immutable/i)
  })

  // ─── Test 2: Attempt to update salary components in frozen month ─────────
  it('Test 2: rejects updating salary components for a frozen record with 409 Conflict', async () => {
    const env = createMockEnv()

    const res = await app.fetch(
      new Request('https://paysoft.local/api/payroll/salary-record/sr_freeze_001', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-org-id': TEST_ORG_ID,
        },
        body: JSON.stringify({
          basicPay: 70000,
          grossEarnings: 85000,
        }),
      }),
      env
    )

    expect(res.status).toBe(409)
    const body = await res.json() as any
    expect(body.error).toMatch(/frozen and immutable/i)
  })

  // ─── Test 3: Attempt to recalculate TDS/deductions for frozen record ─────
  it('Test 3: rejects recalculating TDS or deductions for frozen records with 409 Conflict', async () => {
    const env = createMockEnv()

    const res = await app.fetch(
      new Request('https://paysoft.local/api/payroll/recalculate/sr_freeze_001', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-org-id': TEST_ORG_ID,
        },
        body: JSON.stringify({}),
      }),
      env
    )

    expect(res.status).toBe(409)
    const body = await res.json() as any
    expect(body.error).toMatch(/Cannot recalculate TDS or deductions for frozen payroll record/i)
  })

  // ─── Test 4: Direct repository update attempt throws error ──────────────
  it('Test 4: direct repository update on frozen salary records throws an Error', async () => {
    const mockDb: any = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            get: vi.fn(async () => ({
              id: 'sr_freeze_001',
              orgId: TEST_ORG_ID,
              status: 'frozen',
              basicPay: 60000,
            })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn(() => ({
              get: vi.fn(async () => ({ id: 'sr_freeze_001' })),
            })),
          })),
        })),
      })),
    }

    await expect(
      updateSalaryRecord(mockDb, TEST_ORG_ID, 'sr_freeze_001', { basicPay: 75000 })
    ).rejects.toThrow(/frozen and immutable/i)

    await expect(
      updateSalaryRecordStatus(mockDb, TEST_ORG_ID, 'sr_freeze_001', 'draft')
    ).rejects.toThrow(/Cannot modify or unfreeze a frozen salary record/i)
  })

  // ─── Test 5: Retrospective adjustments only allowed in future un-frozen months ─
  it('Test 5: allows retrospective adjustments in future un-frozen month and rejects in frozen month', async () => {
    const env = createMockEnv()

    // 5a: Attempt adjustment targeting frozen month (rejection)
    const rejectRes = await app.fetch(
      new Request('https://paysoft.local/api/payroll/adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-org-id': TEST_ORG_ID,
        },
        body: JSON.stringify({
          orgId: TEST_ORG_ID,
          employeeId: 'emp_001',
          targetMonth: FROZEN_MONTH,
          targetYear: FROZEN_YEAR,
          originalMonth: 6,
          originalYear: 2026,
          adjustmentAmount: 5000,
          reason: 'Underpaid DA in June',
        }),
      }),
      env
    )

    expect(rejectRes.status).toBe(409)
    const rejectBody = await rejectRes.json() as any
    expect(rejectBody.error).toMatch(/frozen and immutable/i)

    // 5b: Apply adjustment targeting an un-frozen future month (success)
    const acceptRes = await app.fetch(
      new Request('https://paysoft.local/api/payroll/adjustments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-org-id': TEST_ORG_ID,
        },
        body: JSON.stringify({
          orgId: TEST_ORG_ID,
          employeeId: 'emp_001',
          targetMonth: UN_FROZEN_MONTH,
          targetYear: FROZEN_YEAR,
          originalMonth: FROZEN_MONTH,
          originalYear: FROZEN_YEAR,
          adjustmentAmount: 5000,
          reason: 'Arrears for July salary revision applied in August',
        }),
      }),
      env
    )

    expect(acceptRes.status).toBe(201)
    const acceptBody = await acceptRes.json() as any
    expect(acceptBody.adjustmentApplied).toBe(true)
    expect(acceptBody.type).toBe('retrospective_arrears')
    expect(acceptBody.targetPeriod).toBe('2026-08')
    expect(acceptBody.originalPeriod).toBe('2026-07')
  })
})
