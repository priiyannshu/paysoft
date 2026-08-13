import { Hono } from 'hono'
import { ESSEngine } from './engine'
import { simulateRegimes } from '../tax/engine'
import { TaxCalculationInput, TaxDeclarations } from '../tax/types'

export const ess = new Hono<{ Bindings: { DB: D1Database } }>()

ess.post('/declaration', async (c) => {
  const { id, employeeId, financialYear, declarations } = await c.req.json<{
    id: string
    employeeId: string
    financialYear: string
    declarations: TaxDeclarations
  }>()

  const engine = new ESSEngine(c.env.DB)
  const result = await engine.submitDeclaration(id, employeeId, financialYear, declarations)
  
  return c.json(result, 201)
})

ess.get('/declarations/:employeeId', async (c) => {
  const employeeId = c.req.param('employeeId')
  const engine = new ESSEngine(c.env.DB)
  const results = await engine.getDeclarations(employeeId)
  
  return c.json(results)
})

ess.post('/leave', async (c) => {
  const { id, employeeId, leaveType, startDate, endDate, days } = await c.req.json<{
    id: string
    employeeId: string
    leaveType: string
    startDate: string
    endDate: string
    days: number
  }>()

  const engine = new ESSEngine(c.env.DB)
  try {
    const result = await engine.applyLeave(id, employeeId, leaveType, startDate, endDate, days)
    return c.json(result, 201)
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

ess.post('/simulate-regime', async (c) => {
  const input = await c.req.json<TaxCalculationInput>()
  const result = simulateRegimes(input)
  return c.json(result)
})
