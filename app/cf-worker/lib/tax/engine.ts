import { calculateIncomeTax } from './income-tax'
import { calculateEPF } from './epf'
import { calculateESI } from './esi'
import { lookupPTax } from './ptax'
import type { TaxCalculationInput, DeductionBreakdown, RegimeComparison } from './types'

export function computeDeductions(input: TaxCalculationInput): DeductionBreakdown {
  const incomeTax = calculateIncomeTax(input)
  const monthlyBasic = input.salary.basic / 12
  const epf = calculateEPF(monthlyBasic)
  const esi = calculateESI(input.monthlyGross)
  const ptax = lookupPTax(input.monthlyGross, input.state)
  
  return { incomeTax, epf, esi, ptax }
}

export function simulateRegimes(input: TaxCalculationInput): RegimeComparison {
  const oldResult = calculateIncomeTax({ ...input, regime: 'old' })
  const newResult = calculateIncomeTax({ ...input, regime: 'new' })
  const recommended = oldResult.totalTax <= newResult.totalTax ? 'old' : 'new'
  const savings = Math.abs(oldResult.totalTax - newResult.totalTax)
  
  return { old: oldResult, new: newResult, recommended, savings }
}
