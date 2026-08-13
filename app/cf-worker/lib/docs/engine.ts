import { PayslipData, Form16Data, EcrData, BankAdviceData } from './types'

// Mock implementations for document generation
// In a real implementation, these would use @react-pdf/renderer, xlsx, etc.

export async function generatePayslip(data: PayslipData): Promise<ArrayBuffer> {
  // TODO: Use @react-pdf/renderer to render HTML-like components to PDF
  // TODO: Password protect with data.dateOfBirth
  const mockContent = `PDF Payload: Payslip for ${data.name} (Protected by DOB: ${data.dateOfBirth})`
  return (new TextEncoder().encode(mockContent).buffer) as ArrayBuffer
}

export async function generateForm16(data: Form16Data): Promise<ArrayBuffer> {
  // TODO: Render Form 16 Part B as PDF with TDS details
  const mockContent = `PDF Payload: Form 16 for PAN ${data.pan} for FY ${data.financialYear}`
  return (new TextEncoder().encode(mockContent).buffer) as ArrayBuffer
}

export async function generateEcrFile(data: EcrData[]): Promise<string> {
  // TODO: Custom text generator for EPFO portal fixed-width format
  let ecrText = 'UAN,EPF_WAGES,EPS_WAGES,EPF_CONT,EPS_CONT,DIFF\n'
  for (const record of data) {
    ecrText += `${record.uan},${record.epfWages},${record.epsWages},${record.epfContribution},${record.epsContribution},${record.diffContribution}\n`
  }
  return ecrText
}

export async function generateEsiFile(data: any[]): Promise<string> {
  // TODO: Monthly contribution report in ESIC format
  return 'ESI_DATA_MOCK'
}

export async function generateBankAdvice(data: BankAdviceData[]): Promise<ArrayBuffer> {
  // TODO: CSV/XLSX formatted for bulk salary credit using xlsx library
  let csvText = 'Account Number,IFSC,Name,Amount\n'
  for (const record of data) {
    csvText += `${record.bankAccount},${record.ifscCode},${record.name},${record.netSalary}\n`
  }
  return (new TextEncoder().encode(csvText).buffer) as ArrayBuffer
}
