import { TaxDeclarationRecord, LeaveApplication, LeaveBalance } from './types'
import { TaxDeclarations } from '../tax/types'

export class ESSEngine {
  constructor(private db: D1Database) {}

  async submitDeclaration(
    id: string,
    employeeId: string,
    financialYear: string,
    declarations: TaxDeclarations
  ): Promise<TaxDeclarationRecord> {
    const now = new Date().toISOString()
    const declarationsJson = JSON.stringify(declarations)
    
    // Insert or replace declaration
    await this.db.prepare(`
      INSERT INTO tax_declarations (id, employee_id, financial_year, declarations_json, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'submitted', ?, ?)
      ON CONFLICT(employee_id, financial_year) DO UPDATE SET
        declarations_json = excluded.declarations_json,
        status = 'submitted',
        updated_at = excluded.updated_at
    `).bind(id, employeeId, financialYear, declarationsJson, now, now).run()

    return {
      id,
      employeeId,
      financialYear,
      declarations,
      status: 'submitted',
      createdAt: now,
      updatedAt: now
    }
  }

  async getDeclarations(employeeId: string): Promise<TaxDeclarationRecord[]> {
    const { results } = await this.db.prepare(`
      SELECT * FROM tax_declarations WHERE employee_id = ?
    `).bind(employeeId).all()

    return results.map((r: any) => ({
      id: r.id,
      employeeId: r.employee_id,
      financialYear: r.financial_year,
      declarations: JSON.parse(r.declarations_json),
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }))
  }

  async applyLeave(
    id: string,
    employeeId: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    days: number
  ): Promise<LeaveApplication> {
    const now = new Date().toISOString()
    
    // Check balance
    const balanceQuery = await this.db.prepare(`
      SELECT balance FROM leave_balances WHERE employee_id = ? AND leave_type = ?
    `).bind(employeeId, leaveType).first()
    
    const currentBalance = (balanceQuery?.balance as number) || 0
    if (currentBalance < days) {
      throw new Error('Insufficient leave balance')
    }

    // Insert leave application
    await this.db.prepare(`
      INSERT INTO leave_applications (id, employee_id, leave_type, start_date, end_date, days, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(id, employeeId, leaveType, startDate, endDate, days, now, now).run()
    
    // Deduct from balance
    await this.db.prepare(`
      UPDATE leave_balances SET balance = balance - ? WHERE employee_id = ? AND leave_type = ?
    `).bind(days, employeeId, leaveType).run()

    return {
      id,
      employeeId,
      leaveType,
      startDate,
      endDate,
      days,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    }
  }
}
