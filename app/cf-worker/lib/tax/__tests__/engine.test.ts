import { describe, it, expect } from 'vitest';
import { computeDeductions, simulateRegimes } from '../engine';
import type { TaxCalculationInput } from '../types';

describe('engine', () => {
  describe('computeDeductions', () => {
    it('should compute deductions with all four sections', () => {
      const input: TaxCalculationInput = {
        salary: { basic: 600000, hra: 300000, specialAllowance: 200000, otherAllowances: 100000 },
        declarations: { section80C: 150000, section80D: 25000, section24b: 0, rentPaid: 150000, isMetro: true },
        regime: 'old',
        state: 'MH',
        monthlyGross: 100000,
      };
      const result = computeDeductions(input);
      expect(result).toHaveProperty('incomeTax');
      expect(result).toHaveProperty('epf');
      expect(result).toHaveProperty('esi');
      expect(result).toHaveProperty('ptax');
      
      expect(typeof result.incomeTax.totalTax).toBe('number');
      expect(typeof result.epf.employeeEPF).toBe('number');
      expect(typeof result.esi.employeeESI).toBe('number');
      expect(typeof result.ptax.monthlyPTax).toBe('number');
    });
  });

  describe('simulateRegimes', () => {
    it('should recommend old regime for high deductions', () => {
      const input: TaxCalculationInput = {
        salary: { basic: 1500000, hra: 750000, specialAllowance: 450000, otherAllowances: 300000 },
        declarations: { section80C: 150000, section80D: 50000, section24b: 200000, rentPaid: 600000, isMetro: true },
        regime: 'old',
        state: 'MH',
        monthlyGross: 250000,
      };
      const result = simulateRegimes(input);
      expect(result.recommended).toBe('old');
      expect(result.savings).toBeGreaterThan(0);
    });

    it('should recommend new regime for mid salary with low deductions', () => {
      const input: TaxCalculationInput = {
        salary: { basic: 600000, hra: 300000, specialAllowance: 200000, otherAllowances: 100000 },
        declarations: { section80C: 0, section80D: 0, section24b: 0, rentPaid: 0, isMetro: true },
        regime: 'new',
        state: 'MH',
        monthlyGross: 100000,
      };
      const result = simulateRegimes(input);
      expect(result.recommended).toBe('new');
    });
  });
});
