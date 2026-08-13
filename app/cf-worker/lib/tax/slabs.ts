import type { TaxSlab } from './types'

/** FY 2025-26 Income Tax Slabs — Old Regime
 *  Ranges use half-open intervals: [from, to) */
export const OLD_REGIME_SLABS: TaxSlab[] = [
  { from: 0, to: 250000, rate: 0 },
  { from: 250000, to: 500000, rate: 0.05 },
  { from: 500000, to: 1000000, rate: 0.20 },
  { from: 1000000, to: Infinity, rate: 0.30 }
]

/** FY 2025-26 Income Tax Slabs — New Regime (post-Budget 2025)
 *  Ranges use half-open intervals: [from, to) */
export const NEW_REGIME_SLABS: TaxSlab[] = [
  { from: 0, to: 400000, rate: 0 },
  { from: 400000, to: 800000, rate: 0.05 },
  { from: 800000, to: 1200000, rate: 0.10 },
  { from: 1200000, to: 1600000, rate: 0.15 },
  { from: 1600000, to: 2000000, rate: 0.20 },
  { from: 2000000, to: 2400000, rate: 0.25 },
  { from: 2400000, to: Infinity, rate: 0.30 }
]

/** Surcharge slabs — Old Regime. Half-open intervals on taxable income. */
export const SURCHARGE_SLABS_OLD: TaxSlab[] = [
  { from: 0, to: 5000000, rate: 0 },
  { from: 5000000, to: 10000000, rate: 0.10 },
  { from: 10000000, to: 20000000, rate: 0.15 },
  { from: 20000000, to: 50000000, rate: 0.25 },
  { from: 50000000, to: Infinity, rate: 0.37 }
]

/** Surcharge slabs — New Regime. Capped at 25%. Half-open intervals. */
export const SURCHARGE_SLABS_NEW: TaxSlab[] = [
  { from: 0, to: 5000000, rate: 0 },
  { from: 5000000, to: 10000000, rate: 0.10 },
  { from: 10000000, to: 20000000, rate: 0.15 },
  { from: 20000000, to: Infinity, rate: 0.25 }
]

export const CESS_RATE = 0.04
export const STANDARD_DEDUCTION_OLD = 50000
export const STANDARD_DEDUCTION_NEW = 75000
export const SECTION_87A_LIMIT_OLD = 500000
export const SECTION_87A_REBATE_OLD = 12500
export const SECTION_87A_LIMIT_NEW = 1200000
export const SECTION_87A_REBATE_NEW = 60000
export const SECTION_80C_CAP = 150000
