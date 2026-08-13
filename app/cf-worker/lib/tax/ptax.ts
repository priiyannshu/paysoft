import type { PTaxResult, PTaxSlab } from './types'

export const STATE_PTAX_SLABS: Record<string, PTaxSlab[]> = {
  MH: [
    { from: 0, to: 7500, tax: 0 },
    { from: 7501, to: 10000, tax: 175 },
    { from: 10001, to: Infinity, tax: 200 }
  ],
  KA: [
    { from: 0, to: 25000, tax: 0 },
    { from: 25001, to: Infinity, tax: 200 }
  ],
  TN: [
    { from: 0, to: 30000, tax: 0 },
    { from: 30001, to: 45000, tax: 235 },
    { from: 45001, to: 60000, tax: 510 },
    { from: 60001, to: 75000, tax: 760 },
    { from: 75001, to: Infinity, tax: 1095 }
  ],
  WB: [
    { from: 0, to: 10000, tax: 0 },
    { from: 10001, to: 15000, tax: 110 },
    { from: 15001, to: 25000, tax: 130 },
    { from: 25001, to: 40000, tax: 150 },
    { from: 40001, to: Infinity, tax: 200 }
  ],
  TG: [
    { from: 0, to: 15000, tax: 0 },
    { from: 15001, to: 20000, tax: 150 },
    { from: 20001, to: Infinity, tax: 200 }
  ],
  AP: [
    { from: 0, to: 15000, tax: 0 },
    { from: 15001, to: 20000, tax: 150 },
    { from: 20001, to: Infinity, tax: 200 }
  ],
  GJ: [
    { from: 0, to: 5999, tax: 0 },
    { from: 6000, to: 8999, tax: 80 },
    { from: 9000, to: 11999, tax: 150 },
    { from: 12000, to: Infinity, tax: 200 }
  ]
}

export function lookupPTax(monthlySalary: number, state: string): PTaxResult {
  const slabs = STATE_PTAX_SLABS[state.toUpperCase()]
  
  if (!slabs) {
    return {
      monthlyPTax: 0,
      annualPTax: 0,
      state
    }
  }

  let monthlyPTax = 0
  for (const slab of slabs) {
    if (monthlySalary >= slab.from && monthlySalary <= slab.to) {
      monthlyPTax = slab.tax
      break
    }
  }

  return {
    monthlyPTax,
    annualPTax: monthlyPTax * 12,
    state
  }
}
