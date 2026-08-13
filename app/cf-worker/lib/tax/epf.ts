import type { EPFResult } from './types'

export function calculateEPF(monthlyBasic: number): EPFResult {
  const employeeEPF = Math.round(monthlyBasic * 0.12)
  const epsBase = Math.min(monthlyBasic, 15000)
  const employerEPS = Math.round(epsBase * 0.0833)
  const employerEPF = Math.round(monthlyBasic * 0.12) - employerEPS
  const employerTotal = employerEPS + employerEPF

  return {
    employeeEPF,
    employerEPS,
    employerEPF,
    employerTotal
  }
}
