import type { DeductionBreakdown } from '../tax/types'

/** Lifecycle state machine: Draft → Processing → Computed → Frozen */
export type PayrollRunStatus = 'draft' | 'processing' | 'computed' | 'frozen'

/** Valid state transitions */
export const VALID_TRANSITIONS: Record<PayrollRunStatus, PayrollRunStatus[]> = {
  draft: ['processing'],
  processing: ['computed'],
  computed: ['frozen'],
  frozen: [],
}

/** Employee attendance input for a payroll run */
export interface EmployeeAttendance {
  employeeId: string
  basic: number
  da: number                   // Dearness Allowance
  hra: number
  specialAllowance: number
  otherAllowances: number
  workingDays: number          // Total working days in the month
  unpaidDays: number           // Days absent without pay (for LOP)
  arrearMonths: number         // Number of retroactive months for salary revision
  oldBasic: number             // Previous basic (for arrears calculation)
  oldDa: number                // Previous DA (for arrears calculation)
  bonuses: number              // One-time bonuses for this month
  advanceRecovery: number      // Advance salary recovery deduction
  rentPaid: number             // Annual rent paid (for HRA exemption)
  isMetro: boolean             // Metro city for HRA (50% vs 40%)
  regime: 'old' | 'new'        // Tax regime
  state: string                // State code for PTax
}

/** Payroll run request */
export interface PayrollRunInput {
  orgId: string
  month: number                // 1-12
  year: number
  employees: EmployeeAttendance[]
}

/** Per-employee salary breakdown produced by the engine */
export interface EmployeeSalaryRecord {
  employeeId: string
  grossEarnings: number
  lop: number
  arrears: number
  bonuses: number
  advanceRecovery: number
  totalEarnings: number        // gross - LOP + arrears + bonuses
  deductions: DeductionBreakdown
  totalDeductions: number
  netPay: number
}

/** A payroll run persisted in D1 */
export interface PayrollRun {
  id: string
  orgId: string
  month: number
  year: number
  status: PayrollRunStatus
  records: EmployeeSalaryRecord[]
  createdAt: string
  updatedAt: string
}

/** Response from POST /payroll/run */
export interface PayrollRunResult {
  runId: string
  orgId: string
  month: number
  year: number
  status: PayrollRunStatus
  employeeCount: number
  totalNetPay: number
  records: EmployeeSalaryRecord[]
}
