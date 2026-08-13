import { describe, it, expect } from 'vitest'
import { computeEmployeeSalary, executePayrollRun, canTransition } from '../engine'
import type { EmployeeAttendance, PayrollRunInput } from '../types'

function makeEmployee(overrides: Partial<EmployeeAttendance> = {}): EmployeeAttendance {
  return {
    employeeId: 'EMP-001',
    basic: 30000,
    da: 5000,
    hra: 12000,
    specialAllowance: 8000,
    otherAllowances: 5000,
    workingDays: 22,
    unpaidDays: 0,
    arrearMonths: 0,
    oldBasic: 30000,
    oldDa: 5000,
    bonuses: 0,
    advanceRecovery: 0,
    rentPaid: 0,
    isMetro: false,
    regime: 'new',
    state: 'KA',
    ...overrides,
  }
}

describe('computeEmployeeSalary', () => {
  it('computes gross earnings correctly', () => {
    const result = computeEmployeeSalary(makeEmployee())
    // basic(30000) + da(5000) + hra(12000) + special(8000) + other(5000)
    expect(result.grossEarnings).toBe(60000)
  })

  it('computes LOP correctly', () => {
    const result = computeEmployeeSalary(makeEmployee({ unpaidDays: 2 }))
    // LOP = (30000 + 5000) / 22 × 2 = 3182 (rounded)
    const expectedLop = Math.round(((30000 + 5000) / 22) * 2)
    expect(result.lop).toBe(expectedLop)
  })

  it('handles zero working days without division error', () => {
    const result = computeEmployeeSalary(makeEmployee({ workingDays: 0, unpaidDays: 0 }))
    expect(result.lop).toBe(0)
  })

  it('computes arrears for salary revision', () => {
    const result = computeEmployeeSalary(makeEmployee({
      basic: 35000,
      da: 6000,
      oldBasic: 30000,
      oldDa: 5000,
      arrearMonths: 3,
    }))
    // Arrears = ((35000 + 6000) - (30000 + 5000)) × 3 = 6000 × 3 = 18000
    expect(result.arrears).toBe(18000)
  })

  it('includes bonuses in total earnings', () => {
    const result = computeEmployeeSalary(makeEmployee({ bonuses: 10000 }))
    expect(result.totalEarnings).toBe(result.grossEarnings - result.lop + result.arrears + 10000)
  })

  it('subtracts advance recovery from net pay', () => {
    const withRecovery = computeEmployeeSalary(makeEmployee({ advanceRecovery: 5000 }))
    const without = computeEmployeeSalary(makeEmployee({ advanceRecovery: 0 }))
    expect(withRecovery.netPay).toBe(without.netPay - 5000)
  })

  it('calls Engine 3 and includes statutory deductions', () => {
    const result = computeEmployeeSalary(makeEmployee())
    // Should have income tax, EPF, ESI, PTax
    expect(result.deductions.incomeTax).toBeDefined()
    expect(result.deductions.epf).toBeDefined()
    expect(result.deductions.esi).toBeDefined()
    expect(result.deductions.ptax).toBeDefined()
    expect(result.totalDeductions).toBeGreaterThan(0)
  })

  it('produces positive net pay for normal salary', () => {
    const result = computeEmployeeSalary(makeEmployee())
    expect(result.netPay).toBeGreaterThan(0)
  })
})

describe('executePayrollRun', () => {
  it('processes all employees and returns summary', () => {
    const input: PayrollRunInput = {
      orgId: 'ORG-1',
      month: 8,
      year: 2026,
      employees: [
        makeEmployee({ employeeId: 'EMP-001' }),
        makeEmployee({ employeeId: 'EMP-002', basic: 50000 }),
      ],
    }

    const result = executePayrollRun(input)

    expect(result.runId).toMatch(/^PR-ORG-1-2026-08-/)
    expect(result.orgId).toBe('ORG-1')
    expect(result.month).toBe(8)
    expect(result.year).toBe(2026)
    expect(result.status).toBe('computed')
    expect(result.employeeCount).toBe(2)
    expect(result.records).toHaveLength(2)
    expect(result.totalNetPay).toBe(
      result.records[0].netPay + result.records[1].netPay
    )
  })
})

describe('canTransition (state machine)', () => {
  it('allows draft → processing', () => {
    expect(canTransition('draft', 'processing')).toBe(true)
  })

  it('allows processing → computed', () => {
    expect(canTransition('processing', 'computed')).toBe(true)
  })

  it('allows computed → frozen', () => {
    expect(canTransition('computed', 'frozen')).toBe(true)
  })

  it('disallows frozen → anything', () => {
    expect(canTransition('frozen', 'draft')).toBe(false)
    expect(canTransition('frozen', 'processing')).toBe(false)
    expect(canTransition('frozen', 'computed')).toBe(false)
    expect(canTransition('frozen', 'frozen')).toBe(false)
  })

  it('disallows skipping states', () => {
    expect(canTransition('draft', 'computed')).toBe(false)
    expect(canTransition('draft', 'frozen')).toBe(false)
    expect(canTransition('processing', 'frozen')).toBe(false)
  })

  it('disallows reverse transitions', () => {
    expect(canTransition('computed', 'processing')).toBe(false)
    expect(canTransition('processing', 'draft')).toBe(false)
  })
})
