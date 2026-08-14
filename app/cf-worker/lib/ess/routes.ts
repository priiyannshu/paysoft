import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { ESSEngine } from './engine'
import { simulateRegimes } from '../tax/engine'
import { TaxCalculationInput, TaxDeclarations } from '../tax/types'
import { ESSDeclarationSchema, LeaveApplicationSchema } from '../../security/schemas'

export const ess = new Hono<{ Bindings: { DB: D1Database } }>()

ess.post('/declaration', zValidator('json', ESSDeclarationSchema), async (c) => {
  const { id, employeeId, financialYear, declarations } = c.req.valid('json') as any

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

ess.post('/leave', zValidator('json', LeaveApplicationSchema), async (c) => {
  const { id, employeeId, leaveType, startDate, endDate, days } = c.req.valid('json') as any

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

ess.post('/declaration/:id/approve', async (c) => {
  const id = c.req.param('id')
  const engine = new ESSEngine(c.env.DB)
  const result = await engine.approveDeclaration(id)
  return c.json(result)
})

ess.post('/declaration/:id/reject', async (c) => {
  const id = c.req.param('id')
  const engine = new ESSEngine(c.env.DB)
  const result = await engine.rejectDeclaration(id)
  return c.json(result)
})
