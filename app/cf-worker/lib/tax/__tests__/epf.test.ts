import { describe, it, expect } from 'vitest';
import { calculateEPF } from '../epf';

describe('epf', () => {
  describe('calculateEPF', () => {
    it('Basic 15,000', () => {
      const result = calculateEPF(15000);
      expect(result.employeeEPF).toBe(1800);
      expect(result.employerEPS).toBe(1250);
      expect(result.employerEPF).toBe(550);
      expect(result.employerTotal).toBe(1800);
    });

    it('Basic 30,000', () => {
      const result = calculateEPF(30000);
      expect(result.employeeEPF).toBe(3600);
      expect(result.employerEPS).toBe(1250);
      expect(result.employerEPF).toBe(2350);
      expect(result.employerTotal).toBe(3600);
    });

    it('Basic 10,000', () => {
      const result = calculateEPF(10000);
      expect(result.employeeEPF).toBe(1200);
      expect(result.employerEPS).toBe(833);
      expect(result.employerEPF).toBe(367);
      expect(result.employerTotal).toBe(1200);
    });

    it('Basic 0', () => {
      const result = calculateEPF(0);
      expect(result.employeeEPF).toBe(0);
      expect(result.employerEPS).toBe(0);
      expect(result.employerEPF).toBe(0);
      expect(result.employerTotal).toBe(0);
    });
  });
});
