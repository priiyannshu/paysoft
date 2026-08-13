import type { SalaryStructure, TaxCalculationInput, IncomeTaxResult, TaxSlab } from './types'
import {
  OLD_REGIME_SLABS, NEW_REGIME_SLABS, SURCHARGE_SLABS_OLD, SURCHARGE_SLABS_NEW,
  CESS_RATE, STANDARD_DEDUCTION_OLD, STANDARD_DEDUCTION_NEW, SECTION_87A_LIMIT_OLD,
  SECTION_87A_REBATE_OLD, SECTION_87A_LIMIT_NEW, SECTION_87A_REBATE_NEW, SECTION_80C_CAP
} from './slabs'

export function calculateGrossIncome(salary: SalaryStructure): number {
  return salary.basic + salary.hra + salary.specialAllowance + salary.otherAllowances
}

export function calculateHRAExemption(basic: number, hra: number, rentPaid: number, isMetro: boolean): number {
  if (rentPaid <= 0) return 0
  
  const rule1 = hra
  const rule2 = (isMetro ? 0.5 : 0.4) * basic
  const rule3 = rentPaid - (0.1 * basic)
  
  const exemption = Math.min(rule1, rule2, rule3)
  return exemption > 0 ? Math.round(exemption) : 0
}

export function applySlabs(taxableIncome: number, slabs: TaxSlab[]): number {
  if (taxableIncome <= 0) return 0

  let tax = 0
  for (const slab of slabs) {
    if (taxableIncome <= slab.from) break
    const taxableInThisSlab = Math.min(taxableIncome, slab.to) - slab.from
    tax += taxableInThisSlab * slab.rate
  }
  return Math.round(tax)
}

export function calculateSurcharge(tax: number, taxableIncome: number, slabs: TaxSlab[]): number {
  let surchargeRate = 0
  for (const slab of slabs) {
    if (taxableIncome > slab.from && taxableIncome <= slab.to) {
      surchargeRate = slab.rate
      break
    }
  }
  return Math.round(tax * surchargeRate)
}

export function calculateIncomeTax(input: TaxCalculationInput): IncomeTaxResult {
  const { salary, declarations, regime } = input
  const grossIncome = calculateGrossIncome(salary)
  
  let hraExemption = 0
  let standardDeduction = 0
  let section80C = 0
  let section80D = 0
  let section24b = 0
  
  let totalDeductions = 0
  
  if (regime === 'old') {
    standardDeduction = STANDARD_DEDUCTION_OLD
    hraExemption = calculateHRAExemption(salary.basic, salary.hra, declarations.rentPaid, declarations.isMetro)
    section80C = Math.min(declarations.section80C, SECTION_80C_CAP)
    section80D = declarations.section80D
    section24b = declarations.section24b
    
    totalDeductions = standardDeduction + hraExemption + section80C + section80D + section24b
  } else {
    standardDeduction = STANDARD_DEDUCTION_NEW
    totalDeductions = standardDeduction
  }
  
  let taxableIncome = grossIncome - totalDeductions
  taxableIncome = Math.max(0, Math.floor(taxableIncome))
  
  const slabs = regime === 'old' ? OLD_REGIME_SLABS : NEW_REGIME_SLABS
  const taxBeforeRebate = applySlabs(taxableIncome, slabs)
  
  let section87ARebate = 0
  if (regime === 'old') {
    if (taxableIncome <= SECTION_87A_LIMIT_OLD) {
      section87ARebate = Math.min(taxBeforeRebate, SECTION_87A_REBATE_OLD)
    }
  } else {
    if (taxableIncome <= SECTION_87A_LIMIT_NEW) {
      section87ARebate = Math.min(taxBeforeRebate, SECTION_87A_REBATE_NEW)
    }
  }
  
  const taxAfterRebate = taxBeforeRebate - section87ARebate
  
  const surchargeSlabs = regime === 'old' ? SURCHARGE_SLABS_OLD : SURCHARGE_SLABS_NEW
  const surcharge = calculateSurcharge(taxAfterRebate, taxableIncome, surchargeSlabs)
  
  const cess = Math.round((taxAfterRebate + surcharge) * CESS_RATE)
  
  const totalTax = taxAfterRebate + surcharge + cess
  
  return {
    grossIncome,
    hraExemption,
    standardDeduction,
    section80C,
    section80D,
    section24b,
    totalDeductions,
    taxableIncome,
    taxBeforeRebate,
    section87ARebate,
    taxAfterRebate,
    surcharge,
    cess,
    totalTax,
    regime
  }
}
