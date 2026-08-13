import { EmployeeRecord, AuditReport, AuditIssue } from './types'

function calculateAge(dobStr: string): number {
  const dob = new Date(dobStr)
  if (isNaN(dob.getTime())) return 0
  
  const diffMs = Date.now() - dob.getTime()
  const ageDt = new Date(diffMs)
  return Math.abs(ageDt.getUTCFullYear() - 1970)
}

export function generateAuditReport(
  orgId: string, 
  employees: EmployeeRecord[], 
  priorMonthFrozen: boolean
): AuditReport {
  const issues: AuditIssue[] = []
  
  if (!priorMonthFrozen) {
    issues.push({
      severity: 'Critical',
      type: 'PAYROLL_NOT_FROZEN',
      message: 'Prior month payroll is not frozen. Cannot process current month.'
    })
  }

  for (const emp of employees) {
    // Missing KYC
    if (!emp.pan) {
      issues.push({ employeeId: emp.id, severity: 'Critical', type: 'MISSING_PAN', message: 'PAN is missing' })
    }
    if (!emp.aadhaar) {
      issues.push({ employeeId: emp.id, severity: 'Warning', type: 'MISSING_AADHAAR', message: 'Aadhaar is missing' })
    }
    if (!emp.bankAccount) {
      issues.push({ employeeId: emp.id, severity: 'Critical', type: 'MISSING_BANK', message: 'Bank account details are missing' })
    }
    
    // Missing statutory
    if (!emp.pfUan) {
      issues.push({ employeeId: emp.id, severity: 'Warning', type: 'MISSING_PF', message: 'PF UAN is missing' })
    }
    if (!emp.esiNumber) {
      issues.push({ employeeId: emp.id, severity: 'Info', type: 'MISSING_ESI', message: 'ESI number is missing' })
    }

    // Salary Structure
    if (!emp.salaryStructureId) {
      issues.push({ employeeId: emp.id, severity: 'Critical', type: 'MISSING_SALARY_STRUCTURE', message: 'Salary structure is not assigned' })
    }

    // Age Checks (Senior Citizen)
    if (emp.dateOfBirth) {
      const age = calculateAge(emp.dateOfBirth)
      if (age >= 80) {
        issues.push({ employeeId: emp.id, severity: 'Info', type: 'SUPER_SENIOR_CITIZEN', message: 'Employee is a super senior citizen (>= 80 years)' })
      } else if (age >= 60) {
        issues.push({ employeeId: emp.id, severity: 'Info', type: 'SENIOR_CITIZEN', message: 'Employee is a senior citizen (>= 60 years)' })
      }
    } else {
      issues.push({ employeeId: emp.id, severity: 'Warning', type: 'MISSING_DOB', message: 'Date of birth is missing' })
    }
  }

  return {
    orgId,
    timestamp: new Date().toISOString(),
    issues,
    summary: {
      critical: issues.filter(i => i.severity === 'Critical').length,
      warning: issues.filter(i => i.severity === 'Warning').length,
      info: issues.filter(i => i.severity === 'Info').length
    }
  }
}
