import { computeDeductions } from '../tax/engine'
import type { TaxCalculationInput } from '../tax/types'
import type {
  EmployeeAttendance,
  EmployeeSalaryRecord,
  PayrollRunInput,
  PayrollRunResult,
  PayrollRunStatus,
} from './types'
import { VALID_TRANSITIONS } from './types'

/**
 * Core payroll computation for a single employee.
 *
 * Steps:
 * 1. Calculate gross earnings from salary components
 * 2. Calculate LOP = (Basic + DA) / workingDays × unpaidDays
 * 3. Add arrears = (newBasic + newDA - oldBasic - oldDA) × retroactive months
 * 4. Add bonuses, subtract advance recoveries
 * 5. Call Engine 3 for statutory deductions
 * 6. Produce net pay
 */
export function computeEmployeeSalary(emp: EmployeeAttendance): EmployeeSalaryRecord {
  // Gross earnings from all salary components
  const grossEarnings = emp.basic + emp.da + emp.hra + emp.specialAllowance + emp.otherAllowances

  // LOP: (Basic + DA) / working days × unpaid days
  const lop = emp.workingDays > 0
    ? Math.round(((emp.basic + emp.da) / emp.workingDays) * emp.unpaidDays)
    : 0

  // Arrears: delta between new and old salary × retroactive months
  const arrears = emp.arrearMonths > 0
    ? Math.round(((emp.basic + emp.da) - (emp.oldBasic + emp.oldDa)) * emp.arrearMonths)
    : 0

  // Total earnings after adjustments
  const totalEarnings = grossEarnings - lop + arrears + emp.bonuses

  // Monthly gross for ESI check (post-LOP, pre-deductions)
  const monthlyGross = grossEarnings - lop

  // Call Engine 3: statutory deductions
  const taxInput: TaxCalculationInput = {
    salary: {
      basic: emp.basic * 12,               // Engine 3 expects annual
      hra: emp.hra * 12,
      specialAllowance: emp.specialAllowance * 12,
      otherAllowances: emp.otherAllowances * 12,
    },
    declarations: emp.declarations || {
      section80C: 0,
      section80D: 0,
      section24b: 0,
      rentPaid: emp.rentPaid,
      isMetro: emp.isMetro,
    },
    regime: emp.regime,
    state: emp.state,
    monthlyGross,
  }

  const deductions = computeDeductions(taxInput)

  // Monthly deductions total (TDS + EPF employee + ESI employee + PTax)
  const monthlyTDS = Math.round(deductions.incomeTax.totalTax / 12)
  const totalDeductions =
    monthlyTDS +
    deductions.epf.employeeEPF +
    deductions.esi.employeeESI +
    deductions.ptax.monthlyPTax +
    emp.advanceRecovery

  const netPay = totalEarnings - totalDeductions

  return {
    employeeId: emp.employeeId,
    grossEarnings,
    lop,
    arrears,
    bonuses: emp.bonuses,
    advanceRecovery: emp.advanceRecovery,
    totalEarnings,
    deductions,
    totalDeductions,
    netPay,
  }
}

/**
 * Execute a full payroll run for all employees.
 * Returns the result with per-employee breakdown.
 */
export function executePayrollRun(input: PayrollRunInput): PayrollRunResult {
  const runId = `PR-${input.orgId}-${input.year}-${String(input.month).padStart(2, '0')}-${Date.now()}`
  const records = input.employees.map(computeEmployeeSalary)
  const totalNetPay = records.reduce((sum, r) => sum + r.netPay, 0)

  return {
    runId,
    orgId: input.orgId,
    month: input.month,
    year: input.year,
    status: 'computed',
    employeeCount: records.length,
    totalNetPay,
    records,
  }
}

/**
 * Validate a state machine transition.
 * Returns true if moving from `current` to `next` is legal.
 */
export function canTransition(current: PayrollRunStatus, next: PayrollRunStatus): boolean {
  return VALID_TRANSITIONS[current].includes(next)
}
