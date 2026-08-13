import type { ESIResult } from './types'

export function calculateESI(monthlyGross: number): ESIResult {
  if (monthlyGross > 21000) {
    return {
      applicable: false,
      employeeESI: 0,
      employerESI: 0
    }
  }

  const employeeESI = Math.round(monthlyGross * 0.0075)
  const employerESI = Math.round(monthlyGross * 0.0325)

  return {
    applicable: true,
    employeeESI,
    employerESI
  }
}
