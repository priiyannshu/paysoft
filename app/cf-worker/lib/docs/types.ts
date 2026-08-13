export interface DocumentRequest {
  payrollRunId: string
  orgId: string
  documentType: 'payslip' | 'form16' | 'ecr' | 'bank_advice'
}

export interface DocumentResponse {
  fileId: string
  url: string
  status: 'generated' | 'failed'
  error?: string
}

export interface PayslipData {
  employeeId: string
  name: string
  dateOfBirth: string
  netPay: number
  grossPay: number
  deductions: number
  // Add other payslip fields as needed
}

export interface Form16Data {
  employeeId: string
  pan: string
  financialYear: string
  totalIncome: number
  totalTax: number
}

export interface EcrData {
  employeeId: string
  uan: string
  epfWages: number
  epsWages: number
  epfContribution: number
  epsContribution: number
  diffContribution: number
}

export interface BankAdviceData {
  employeeId: string
  name: string
  bankAccount: string
  ifscCode: string
  netSalary: number
}
