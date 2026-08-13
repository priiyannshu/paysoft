import { Hono } from 'hono'
import { 
  generatePayslip, 
  generateForm16, 
  generateEcrFile, 
  generateBankAdvice 
} from './engine'

interface DocsEnv {
  Bindings: {
    DB: D1Database
    // R2 binding would go here, e.g., BUCKET: R2Bucket
  }
}

const docs = new Hono<DocsEnv>()

docs.post('/payslip', async (c) => {
  const body = await c.req.json()
  // Mock fetching data
  const data = {
    employeeId: body.employeeId || 'EMP001',
    name: 'John Doe',
    dateOfBirth: '1990-01-01',
    netPay: 50000,
    grossPay: 60000,
    deductions: 10000
  }
  
  const pdfBuffer = await generatePayslip(data)
  
  // TODO: Store in R2 at Phase 1 key layout
  const fileId = `payslip-${Date.now()}.pdf`
  const url = `https://storage.paysoft.local/docs/download/${fileId}`
  
  return c.json({ fileId, url, status: 'generated' })
})

docs.post('/form16', async (c) => {
  const body = await c.req.json()
  const data = {
    employeeId: body.employeeId || 'EMP001',
    pan: 'ABCDE1234F',
    financialYear: '2023-2024',
    totalIncome: 720000,
    totalTax: 25000
  }
  
  const pdfBuffer = await generateForm16(data)
  
  const fileId = `form16-${Date.now()}.pdf`
  const url = `https://storage.paysoft.local/docs/download/${fileId}`
  
  return c.json({ fileId, url, status: 'generated' })
})

docs.post('/ecr', async (c) => {
  const body = await c.req.json()
  const data = [
    { employeeId: 'EMP001', uan: '100000000001', epfWages: 15000, epsWages: 15000, epfContribution: 1800, epsContribution: 1250, diffContribution: 550 }
  ]
  
  const textContent = await generateEcrFile(data)
  
  const fileId = `ecr-${Date.now()}.txt`
  const url = `https://storage.paysoft.local/docs/download/${fileId}`
  
  return c.json({ fileId, url, status: 'generated' })
})

docs.post('/bank-advice', async (c) => {
  const body = await c.req.json()
  const data = [
    { employeeId: 'EMP001', name: 'John Doe', bankAccount: '1234567890', ifscCode: 'HDFC0001234', netSalary: 50000 }
  ]
  
  const xlsxBuffer = await generateBankAdvice(data)
  
  const fileId = `bank-advice-${Date.now()}.xlsx`
  const url = `https://storage.paysoft.local/docs/download/${fileId}`
  
  return c.json({ fileId, url, status: 'generated' })
})

docs.get('/download/:fileId', async (c) => {
  const fileId = c.req.param('fileId')
  
  // TODO: Fetch file from R2 using fileId
  // Mock return
  return c.text(`Mock File Content for ${fileId}`)
})

export { docs }
