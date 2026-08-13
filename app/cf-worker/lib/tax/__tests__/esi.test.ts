import { describe, it, expect } from 'vitest';
import { calculateESI } from '../esi';

describe('esi', () => {
  describe('calculateESI', () => {
    it('Gross 20,000 (eligible)', () => {
      const result = calculateESI(20000);
      expect(result.applicable).toBe(true);
      expect(result.employeeESI).toBe(150);
      expect(result.employerESI).toBe(650);
    });

    it('Gross 21,000 (boundary, eligible)', () => {
      const result = calculateESI(21000);
      expect(result.applicable).toBe(true);
      expect(result.employeeESI).toBe(158);
      expect(result.employerESI).toBe(683);
    });

    it('Gross 21,001 (not eligible)', () => {
      const result = calculateESI(21001);
      expect(result.applicable).toBe(false);
      expect(result.employeeESI).toBe(0);
      expect(result.employerESI).toBe(0);
    });

    it('Gross 0', () => {
      const result = calculateESI(0);
      expect(result.employeeESI).toBe(0);
      expect(result.employerESI).toBe(0);
    });
  });
});
