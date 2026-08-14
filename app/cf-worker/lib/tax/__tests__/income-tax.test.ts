import { describe, it, expect } from 'vitest';
import { calculateGrossIncome, calculateHRAExemption, calculateIncomeTax } from '../income-tax';
import type { SalaryStructure, TaxCalculationInput } from '../types';

describe('income-tax', () => {
  describe('calculateGrossIncome', () => {
    it('should calculate correct gross income', () => {
      const salary: SalaryStructure = { basic: 300000, hra: 120000, specialAllowance: 80000, otherAllowances: 0 };
      expect(calculateGrossIncome(salary)).toBe(500000);
    });
  });

  describe('calculateHRAExemption', () => {
    it('should calculate correct HRA exemption', () => {
      expect(calculateHRAExemption(300000, 120000, 120000, true)).toBe(90000);
    });
  });

  describe('calculateIncomeTax', () => {
    it('Test Case 1: Low salary, old regime, 87A rebate applies', () => {
      const input: TaxCalculationInput = {
        salary: { basic: 300000, hra: 120000, specialAllowance: 80000, otherAllowances: 0 },
        declarations: { section80C: 50000, section80D: 0, section24b: 0, rentPaid: 120000, isMetro: true },
        regime: 'old',
        state: 'MH',
        monthlyGross: 500000 / 12,
      };
      const result = calculateIncomeTax(input);
      expect(result.grossIncome).toBe(500000);
      expect(result.standardDeduction).toBe(50000);
      expect(result.hraExemption).toBe(90000);
      expect(result.section80C).toBe(50000);
      expect(result.taxableIncome).toBe(310000);
      expect(result.taxBeforeRebate).toBe(3000);
      expect(result.section87ARebate).toBe(3000);
      expect(result.taxAfterRebate).toBe(0);
      expect(result.totalTax).toBe(0);
    });

    it('Test Case 2: Mid salary, new regime', () => {
      const input: TaxCalculationInput = {
        salary: { basic: 600000, hra: 300000, specialAllowance: 200000, otherAllowances: 100000 },
        declarations: { section80C: 50000, section80D: 0, section24b: 0, rentPaid: 120000, isMetro: true },
        regime: 'new',
        state: 'MH',
        monthlyGross: 1200000 / 12,
      };
      const result = calculateIncomeTax(input);
      expect(result.grossIncome).toBe(1200000);
      expect(result.standardDeduction).toBe(75000);
      expect(result.taxableIncome).toBe(1125000);
      expect(result.taxBeforeRebate).toBe(52500);
      expect(result.section87ARebate).toBe(52500);
      expect(result.taxAfterRebate).toBe(0);
      expect(result.totalTax).toBe(0);
    });

    it('Test Case 3: High salary, old regime, no rebate', () => {
      const input: TaxCalculationInput = {
        salary: { basic: 1200000, hra: 600000, specialAllowance: 400000, otherAllowances: 200000 },
        declarations: { section80C: 200000, section80D: 25000, section24b: 200000, rentPaid: 300000, isMetro: true },
        regime: 'old',
        state: 'MH',
        monthlyGross: 2400000 / 12,
      };
      const result = calculateIncomeTax(input);
      expect(result.grossIncome).toBe(2400000);
      expect(result.standardDeduction).toBe(50000);
      expect(result.hraExemption).toBe(180000);
      expect(result.section80C).toBe(150000);
      expect(result.section80D).toBe(25000);
      expect(result.section24b).toBe(200000);
      expect(result.totalDeductions).toBe(605000);
      expect(result.taxableIncome).toBe(1795000);
      expect(result.taxBeforeRebate).toBe(351000);
      expect(result.section87ARebate).toBe(0);
      expect(result.cess).toBe(14040);
      expect(result.totalTax).toBe(365040);
    });

    it('Test Case 4: High salary, new regime, no rebate', () => {
      const input: TaxCalculationInput = {
        salary: { basic: 1200000, hra: 600000, specialAllowance: 400000, otherAllowances: 200000 },
        declarations: { section80C: 200000, section80D: 25000, section24b: 200000, rentPaid: 300000, isMetro: true },
        regime: 'new',
        state: 'MH',
        monthlyGross: 2400000 / 12,
      };
      const result = calculateIncomeTax(input);
      expect(result.grossIncome).toBe(2400000);
      expect(result.standardDeduction).toBe(75000);
      expect(result.taxableIncome).toBe(2325000);
      expect(result.taxBeforeRebate).toBe(281250);
      expect(result.section87ARebate).toBe(0);
      expect(result.cess).toBe(11250);
      expect(result.totalTax).toBe(292500);
    });

    it('Test Case 5: Zero income', () => {
      const input: TaxCalculationInput = {
        salary: { basic: 0, hra: 0, specialAllowance: 0, otherAllowances: 0 },
        declarations: { section80C: 0, section80D: 0, section24b: 0, rentPaid: 0, isMetro: false },
        regime: 'new',
        state: 'MH',
        monthlyGross: 0,
      };
      const result = calculateIncomeTax(input);
      expect(result.totalTax).toBe(0);
    });
  });
});
