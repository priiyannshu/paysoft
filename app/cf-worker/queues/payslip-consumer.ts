import type { PayslipJobMessage } from './types'
import { createDb } from '../db/client'
import { employees, salaryRecords } from '../db/schema'
import { eq, and } from 'drizzle-orm'

export async function handlePayslipQueue(
  batch: MessageBatch<PayslipJobMessage>,
  env: any
): Promise<{ processed: number; failed: number }> {
  let processed = 0
  let failed = 0

  const db = env.DB ? createDb(env.DB) : null

  for (const message of batch.messages) {
    try {
      const { jobId, orgId, month, year, employeeId, totalEmployees } = message.body

      let empName = 'Employee'
      let empCode = '001'
      let basic = 37500
      let da = 28125
      let hra = 11250
      let gross = 76875
      let pfEmp = 1800
      let esiEmp = 0
      let ptax = 200
      let tds = 0
      let totDed = 2000
      let net = 74875

      // Fetch real records from D1 if DB is available
      if (db) {
        const emp = await db
          .select()
          .from(employees)
          .where(and(eq(employees.id, employeeId), eq(employees.orgId, orgId)))
          .get()

        if (emp) {
          empName = `${emp.firstName} ${emp.lastName}`
          empCode = emp.code
          basic = emp.basicPay || 37500
          da = Math.round(basic * ((emp.daPercent ?? 75) / 100))
          hra = Math.round(basic * ((emp.hraPercent ?? 30) / 100))
        }

        const rec = await db
          .select()
          .from(salaryRecords)
          .where(
            and(
              eq(salaryRecords.employeeId, employeeId),
              eq(salaryRecords.month, month),
              eq(salaryRecords.year, year)
            )
          )
          .get()

        if (rec) {
          gross = rec.grossEarnings || basic + da + hra
          pfEmp = rec.pfEmployee || 1800
          esiEmp = rec.esiEmployee || 0
          ptax = rec.professionalTax || 200
          tds = rec.tds || 0
          totDed = rec.totalDeductions || pfEmp + esiEmp + ptax + tds
          net = rec.netPay || gross - totDed
        } else {
          gross = basic + da + hra
          totDed = pfEmp + esiEmp + ptax + tds
          net = gross - totDed
        }
      }

      // Generate HTML payslip content
      const monthNames = [
        '',
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ]
      const monthName = monthNames[month] || 'March'

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payslip - ${empName} (${empCode})</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #1e293b; }
    .slip { max-width: 800px; margin: 0 auto; border: 2px solid #0284c7; padding: 24px; border-radius: 8px; }
    .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
    .org-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
    .slip-title { font-size: 14px; font-weight: 700; color: #0284c7; margin-top: 8px; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; font-size: 12px; }
    .meta-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0; }
    .tables { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f1f5f9; padding: 6px 8px; text-align: left; font-weight: 700; border: 1px solid #cbd5e1; }
    td { padding: 6px 8px; border: 1px solid #cbd5e1; }
    .amount { text-align: right; font-family: monospace; }
    .net-box { background: #f0fdf4; border: 2px solid #22c55e; padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
    .net-val { font-size: 18px; font-weight: 800; color: #15803d; font-family: monospace; }
  </style>
</head>
<body>
  <div class="slip">
    <div class="header">
      <h1 class="org-title">ABCD SCHOOL</h1>
      <div class="slip-title">Salary Pay Slip for ${monthName} ${year}</div>
    </div>
    <div class="grid">
      <div>
        <div class="meta-row"><span>Employee Code:</span> <strong>${empCode}</strong></div>
        <div class="meta-row"><span>Employee Name:</span> <strong>${empName}</strong></div>
      </div>
      <div>
        <div class="meta-row"><span>Payment Mode:</span> <strong>Bank Transfer (NEFT)</strong></div>
        <div class="meta-row"><span>Status:</span> <strong style="color:#15803d;">Disbursed</strong></div>
      </div>
    </div>
    <div class="tables">
      <div>
        <table>
          <thead><tr><th>Earnings Head</th><th class="amount">Amount (₹)</th></tr></thead>
          <tbody>
            <tr><td>Basic Pay</td><td class="amount">${basic.toLocaleString('en-IN')}.00</td></tr>
            <tr><td>DA (75%)</td><td class="amount">${da.toLocaleString('en-IN')}.00</td></tr>
            <tr><td>HRA (30%)</td><td class="amount">${hra.toLocaleString('en-IN')}.00</td></tr>
            <tr style="font-weight:bold; background:#f8fafc;"><td>Gross Earnings</td><td class="amount">₹ ${gross.toLocaleString('en-IN')}.00</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <table>
          <thead><tr><th>Deductions Head</th><th class="amount">Amount (₹)</th></tr></thead>
          <tbody>
            <tr><td>EPF (12%)</td><td class="amount">${pfEmp.toLocaleString('en-IN')}.00</td></tr>
            <tr><td>ESI (0.75%)</td><td class="amount">${esiEmp.toLocaleString('en-IN')}.00</td></tr>
            <tr><td>PTax</td><td class="amount">${ptax.toLocaleString('en-IN')}.00</td></tr>
            <tr><td>TDS</td><td class="amount">${tds.toLocaleString('en-IN')}.00</td></tr>
            <tr style="font-weight:bold; background:#f8fafc;"><td>Total Deductions</td><td class="amount">₹ ${totDed.toLocaleString('en-IN')}.00</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="net-box">
      <div><strong>NET SALARY PAYABLE:</strong></div>
      <div class="net-val">₹ ${net.toLocaleString('en-IN')}.00</div>
    </div>
  </div>
</body>
</html>`

      // Write to R2 if BUCKET is bound
      if (env.BUCKET && typeof env.BUCKET.put === 'function') {
        const monthPad = String(month).padStart(2, '0')
        const r2Key = `payslips/${orgId}/${year}/${monthPad}/${employeeId}.html`
        await env.BUCKET.put(r2Key, htmlContent, {
          httpMetadata: { contentType: 'text/html' },
          customMetadata: {
            orgId,
            employeeId,
            month: String(month),
            year: String(year),
            jobId,
            generatedAt: new Date().toISOString(),
          },
        })
      }

      // Update Durable Object progress if PAYROLL_LOCK is bound
      if (env.PAYROLL_LOCK && typeof env.PAYROLL_LOCK.idFromName === 'function') {
        try {
          const lockId = env.PAYROLL_LOCK.idFromName(`${orgId}:${year}:${month}`)
          const lockStub = env.PAYROLL_LOCK.get(lockId)
          await lockStub.fetch(
            new Request('https://lock/progress/update', {
              method: 'POST',
              body: JSON.stringify({
                currentStage: 'generating_payslips',
                incrementProcessed: 1,
                totalEmployees: totalEmployees || undefined,
              }),
              headers: { 'Content-Type': 'application/json' },
            })
          )
        } catch (lockErr) {
          console.warn('DO progress update error in payslip consumer:', lockErr)
        }
      }

      message.ack()
      processed++
    } catch (err: any) {
      console.error('Payslip generation queue error:', err)
      failed++
      if (message.retry && typeof message.retry === 'function') {
        message.retry()
      }
    }
  }

  return { processed, failed }
}
