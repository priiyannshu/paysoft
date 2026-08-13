import { describe, it, expect } from 'vitest';
import { lookupPTax } from '../ptax';

describe('ptax', () => {
  describe('lookupPTax', () => {
    it('MH, salary 8,000', () => {
      const result = lookupPTax(8000, 'MH');
      expect(result.monthlyPTax).toBe(175);
      expect(result.annualPTax).toBe(2100);
      expect(result.state).toBe('MH');
    });

    it('MH, salary 15,000', () => {
      const result = lookupPTax(15000, 'MH');
      expect(result.monthlyPTax).toBe(200);
      expect(result.annualPTax).toBe(2400);
    });

    it('MH, salary 5,000', () => {
      const result = lookupPTax(5000, 'MH');
      expect(result.monthlyPTax).toBe(0);
    });

    it('KA, salary 30,000', () => {
      const result = lookupPTax(30000, 'KA');
      expect(result.monthlyPTax).toBe(200);
    });

    it('KA, salary 20,000', () => {
      const result = lookupPTax(20000, 'KA');
      expect(result.monthlyPTax).toBe(0);
    });

    it('WB, salary 12,000', () => {
      const result = lookupPTax(12000, 'WB');
      expect(result.monthlyPTax).toBe(110);
    });

    it('Unknown state', () => {
      const result = lookupPTax(12000, 'XX');
      expect(result.monthlyPTax).toBe(0);
      expect(result.annualPTax).toBe(0);
    });
  });
});
