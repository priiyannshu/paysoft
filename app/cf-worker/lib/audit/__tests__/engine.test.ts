import { describe, it, expect } from 'vitest'
import { generateAuditReport } from '../engine'
import type { EmployeeRecord } from '../types'

describe('Audit Engine', () => {
  it('should flag un-frozen prior month as Critical', () => {
    const report = generateAuditReport('ORG-1', [], false)
    expect(report.issues).toEqual([
      { severity: 'Critical', type: 'PAYROLL_NOT_FROZEN', message: 'Prior month payroll is not frozen. Cannot process current month.' }
    ])
    expect(report.summary.critical).toBe(1)
  })

  it('should generate issues for missing details', () => {
    const emp: EmployeeRecord = {
      id: 'EMP-1',
      orgId: 'ORG-1'
    }
    const report = generateAuditReport('ORG-1', [emp], true)
    
    expect(report.issues.some(i => i.type === 'MISSING_PAN')).toBe(true)
    expect(report.issues.some(i => i.type === 'MISSING_AADHAAR')).toBe(true)
    expect(report.issues.some(i => i.type === 'MISSING_BANK')).toBe(true)
    expect(report.issues.some(i => i.type === 'MISSING_PF')).toBe(true)
    expect(report.issues.some(i => i.type === 'MISSING_ESI')).toBe(true)
    expect(report.issues.some(i => i.type === 'MISSING_SALARY_STRUCTURE')).toBe(true)
    expect(report.issues.some(i => i.type === 'MISSING_DOB')).toBe(true)
  })

  it('should identify senior and super senior citizens', () => {
    const d = new Date()

    // 65 years old
    const d65 = new Date()
    d65.setFullYear(d.getFullYear() - 65)

    // 85 years old
    const d85 = new Date()
    d85.setFullYear(d.getFullYear() - 85)

    const empSenior: EmployeeRecord = {
      id: 'EMP-1',
      orgId: 'ORG-1',
      dateOfBirth: d65.toISOString()
    }
    
    const empSuperSenior: EmployeeRecord = {
      id: 'EMP-2',
      orgId: 'ORG-1',
      dateOfBirth: d85.toISOString()
    }

    const report = generateAuditReport('ORG-1', [empSenior, empSuperSenior], true)
    
    expect(report.issues.some(i => i.employeeId === 'EMP-1' && i.type === 'SENIOR_CITIZEN')).toBe(true)
    expect(report.issues.some(i => i.employeeId === 'EMP-2' && i.type === 'SUPER_SENIOR_CITIZEN')).toBe(true)
  })

  it('should return empty issues for fully compliant employee', () => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 30) // 30 years old

    const emp: EmployeeRecord = {
      id: 'EMP-1',
      orgId: 'ORG-1',
      pan: 'ABCDE1234F',
      aadhaar: '123456789012',
      bankAccount: '123456789',
      pfUan: '100000000000',
      esiNumber: '1234567',
      salaryStructureId: 'STRUC-1',
      dateOfBirth: d.toISOString()
    }

    const report = generateAuditReport('ORG-1', [emp], true)
    expect(report.issues).toEqual([])
  })
})
