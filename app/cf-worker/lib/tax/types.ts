/** Salary structure input */
export interface SalaryStructure {
  basic: number
  hra: number
  specialAllowance: number
  otherAllowances: number
}

/** Tax declarations / proof submitted by employee */
export interface TaxDeclarations {
  section80C: number       // LIC, PPF, ELSS, etc. (capped at 1,50,000)
  section80D: number       // Medical insurance premium
  section24b: number       // Home loan interest
  rentPaid: number         // Annual rent paid (for HRA exemption)
  isMetro: boolean         // true if employee lives in metro (50% of basic for HRA), else 40%
}

/** Which tax regime the employee has chosen */
export type TaxRegime = 'old' | 'new'

/** Full input for tax calculation */
export interface TaxCalculationInput {
  salary: SalaryStructure
  declarations: TaxDeclarations
  regime: TaxRegime
  state: string            // State code for PTax lookup (e.g., 'MH', 'KA', 'TN')
  monthlyGross: number     // For ESI eligibility check
}

/** A single tax slab */
export interface TaxSlab {
  from: number
  to: number               // Infinity for last slab
  rate: number             // Percentage as decimal (0.05 = 5%)
}

/** Income tax breakdown */
export interface IncomeTaxResult {
  grossIncome: number
  hraExemption: number
  standardDeduction: number
  section80C: number
  section80D: number
  section24b: number
  totalDeductions: number
  taxableIncome: number
  taxBeforeRebate: number
  section87ARebate: number
  taxAfterRebate: number
  surcharge: number
  cess: number
  totalTax: number
  regime: TaxRegime
}

/** EPF breakdown */
export interface EPFResult {
  employeeEPF: number      // 12% of basic
  employerEPS: number      // 8.33% capped at basic 15,000
  employerEPF: number      // 3.67% (or remainder)
  employerTotal: number    // EPS + EPF
}

/** ESI breakdown */
export interface ESIResult {
  applicable: boolean
  employeeESI: number      // 0.75%
  employerESI: number      // 3.25%
}

/** Professional Tax result */
export interface PTaxResult {
  monthlyPTax: number
  annualPTax: number
  state: string
}

/** Professional Tax slab for a state */
export interface PTaxSlab {
  from: number
  to: number
  tax: number
}

/** Full deduction breakdown returned by the engine */
export interface DeductionBreakdown {
  incomeTax: IncomeTaxResult
  epf: EPFResult
  esi: ESIResult
  ptax: PTaxResult
}

/** Regime comparison for /tax/simulate */
export interface RegimeComparison {
  old: IncomeTaxResult
  new: IncomeTaxResult
  recommended: TaxRegime
  savings: number
}
