import { TaxDeclarations } from '../tax/types'

export interface TaxDeclarationRecord {
  id: string
  employeeId: string
  financialYear: string
  declarations: TaxDeclarations
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface LeaveApplication {
  id: string
  employeeId: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface LeaveBalance {
  employeeId: string
  leaveType: string
  balance: number
}
