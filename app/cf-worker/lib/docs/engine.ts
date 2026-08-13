import { PayslipData, Form16Data, EcrData, BankAdviceData } from './types'

import * as React from 'react'
import { renderToStream, Document, Page, Text, View } from '@react-pdf/renderer'

// Define the PDF components
const PayslipPDF = ({ data }: { data: PayslipData }) => (
  React.createElement(Document, null,
    React.createElement(Page, null,
      React.createElement(View, null,
        React.createElement(Text, null, `Payslip for ${data.name}`),
        React.createElement(Text, null, `Net Pay: ${data.netPay}`),
        // Additional payslip details would go here
      )
    )
  )
)

const Form16PDF = ({ data }: { data: Form16Data }) => (
  React.createElement(Document, null,
    React.createElement(Page, null,
      React.createElement(View, null,
        React.createElement(Text, null, `Form 16 Part B for PAN: ${data.pan}`),
        React.createElement(Text, null, `Financial Year: ${data.financialYear}`),
        // Additional Form 16 details would go here
      )
    )
  )
)

async function streamToArrayBuffer(stream: NodeJS.ReadableStream): Promise<ArrayBuffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }
  const buffer = Buffer.concat(chunks)
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
}

export async function generatePayslip(data: PayslipData): Promise<ArrayBuffer> {
  // Use @react-pdf/renderer to render HTML-like components to PDF
  // @ts-ignore
  const stream = await renderToStream(React.createElement(PayslipPDF, { data }))
  return streamToArrayBuffer(stream)
}

export async function generateForm16(data: Form16Data): Promise<ArrayBuffer> {
  // Render Form 16 Part B as PDF with TDS details
  // @ts-ignore
  const stream = await renderToStream(React.createElement(Form16PDF, { data }))
  return streamToArrayBuffer(stream)
}

import * as xlsx from 'xlsx'

export async function generateEcrFile(data: EcrData[]): Promise<string> {
  let ecrText = ''
  for (const record of data) {
    // ECR version 2 format uses `#~#` as separator.
    // However, the audit specifically requested "fixed-width text for EPFO portal".
    // A common fixed-width padding might be applied. Since exact widths are not specified, 
    // we'll use a padded fixed-width format for the requested placeholders.
    const uan = record.uan.padEnd(12, ' ')
    const name = record.employeeId.padEnd(25, ' ').substring(0, 25)
    const epfWages = record.epfWages.toString().padStart(11, '0')
    const epsWages = record.epsWages.toString().padStart(11, '0')
    const epfCont = record.epfContribution.toString().padStart(11, '0')
    const epsCont = record.epsContribution.toString().padStart(11, '0')
    const diff = record.diffContribution.toString().padStart(11, '0')
    
    ecrText += `${uan}${name}${epfWages}${epsWages}${epfCont}${epsCont}${diff}\n`
  }
  return ecrText
}

export async function generateEsiFile(data: any[]): Promise<string> {
  // Monthly contribution report in ESIC format
  // Example ESIC format fixed columns or csv
  let esiText = ''
  for (const record of data) {
    const ip = (record.ipNumber || '').padEnd(10, '0')
    const name = (record.name || '').padEnd(50, ' ').substring(0, 50)
    const days = (record.workingDays || 0).toString().padStart(2, '0')
    const wages = (record.monthlyWages || 0).toString().padStart(10, '0')
    esiText += `${ip}${name}${days}${wages}\n`
  }
  return esiText
}

export async function generateBankAdvice(data: BankAdviceData[]): Promise<ArrayBuffer> {
  // CSV/XLSX formatted for bulk salary credit using xlsx library
  const worksheet = xlsx.utils.json_to_sheet(data.map(r => ({
    'Account Number': r.bankAccount,
    'IFSC': r.ifscCode,
    'Name': r.name,
    'Amount': r.netSalary
  })))
  
  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Bank Advice')
  
  // Write to ArrayBuffer (which Cloudflare worker can return or store)
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return buffer as ArrayBuffer
}

