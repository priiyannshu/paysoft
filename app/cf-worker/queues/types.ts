export interface PayslipJobMessage {
  jobId: string
  orgId: string
  month: number
  year: number
  employeeId: string
  totalEmployees?: number
  dobPassword?: string
  salaryData?: {
    basic?: number
    da?: number
    hra?: number
    gross?: number
    pfEmp?: number
    pfEmployer?: number
    pfEps?: number
    esiEmp?: number
    esiEmployer?: number
    ptax?: number
    tds?: number
    totalDeductions?: number
    netPay?: number
  }
}

export interface NotifyJobMessage {
  id: string
  type: 'email' | 'audit' | 'webhook' | 'sms'
  recipient: string
  subject?: string
  body: string
  metadata?: Record<string, any>
  timestamp: string
}

export interface BulkPayslipRequest {
  orgId?: string
  month: number
  year: number
  employeeIds?: string[]
}
