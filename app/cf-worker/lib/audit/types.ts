export type Severity = 'Critical' | 'Warning' | 'Info'

export interface EmployeeRecord {
  id: string
  orgId: string
  pan?: string | null
  aadhaar?: string | null
  bankAccount?: string | null
  pfUan?: string | null
  esiNumber?: string | null
  dateOfBirth?: string | null
  salaryStructureId?: string | null
}

export interface AuditIssue {
  employeeId?: string
  severity: Severity
  type: string
  message: string
}

export interface AuditReport {
  orgId: string
  timestamp: string
  issues: AuditIssue[]
  summary: {
    critical: number
    warning: number
    info: number
  }
}
