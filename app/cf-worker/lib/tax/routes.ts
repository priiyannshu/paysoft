import { Hono } from 'hono'
import { computeDeductions, simulateRegimes } from './engine'
import type { TaxCalculationInput } from './types'

const tax = new Hono()

tax.post('/calculate', async (c) => {
  const input = await c.req.json<TaxCalculationInput>()
  const result = computeDeductions(input)
  return c.json(result)
})

tax.post('/simulate', async (c) => {
  const input = await c.req.json<TaxCalculationInput>()
  const result = simulateRegimes(input)
  return c.json(result)
})

export { tax }
