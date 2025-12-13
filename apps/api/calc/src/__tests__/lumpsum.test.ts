/**
 * Unit tests for lumpsum calculations
 */

import {
    calculateLumpsumFV,
    calculateLumpsumFVReal,
    getCompoundingPeriods,
} from '../lumpsum';

describe('getCompoundingPeriods', () => {
    it('should return correct periods for each frequency', () => {
        expect(getCompoundingPeriods('daily')).toBe(365);
        expect(getCompoundingPeriods('monthly')).toBe(12);
        expect(getCompoundingPeriods('quarterly')).toBe(4);
        expect(getCompoundingPeriods('annually')).toBe(1);
    });

    it('should default to monthly for unknown frequency', () => {
        expect(getCompoundingPeriods('unknown' as any)).toBe(12);
    });
});

describe('calculateLumpsumFV', () => {
    it('should calculate correct FV for standard case', () => {
        // ₹25,000 at 12% for 10 years, monthly compounding
        // FV = 25000 × (1 + 0.12/12)^(12×10) = 25000 × (1.01)^120 ≈ 82,509.67
        const fv = calculateLumpsumFV(25000, 0.12, 10, 'monthly');
        expect(fv).toBeCloseTo(82509.67, 0);
    });

    it('should handle annual compounding', () => {
        // ₹10,000 at 10% for 5 years, annually
        // FV = 10000 × (1.10)^5 = 16,105.10
        const fv = calculateLumpsumFV(10000, 0.10, 5, 'annually');
        expect(fv).toBeCloseTo(16105.10, 0);
    });

    it('should handle quarterly compounding', () => {
        // ₹50,000 at 8% for 3 years, quarterly
        // FV = 50000 × (1 + 0.08/4)^(4×3) = 50000 × (1.02)^12 = 63,412.09
        const fv = calculateLumpsumFV(50000, 0.08, 3, 'quarterly');
        expect(fv).toBeCloseTo(63412.09, 0);
    });

    it('should return principal when years is 0', () => {
        const fv = calculateLumpsumFV(25000, 0.12, 0, 'monthly');
        expect(fv).toBe(25000);
    });

    it('should return principal when rate is 0', () => {
        const fv = calculateLumpsumFV(25000, 0, 10, 'monthly');
        expect(fv).toBe(25000);
    });

    it('should return 0 when principal is 0', () => {
        const fv = calculateLumpsumFV(0, 0.12, 10, 'monthly');
        expect(fv).toBe(0);
    });

    it('should return 0 when principal is negative', () => {
        const fv = calculateLumpsumFV(-1000, 0.12, 10, 'monthly');
        expect(fv).toBe(0);
    });

    it('should handle very small rates', () => {
        const fv = calculateLumpsumFV(10000, 0.001, 10, 'monthly');
        expect(fv).toBeGreaterThan(10000);
        expect(fv).toBeLessThan(10200);
    });

    it('should handle very high rates', () => {
        const fv = calculateLumpsumFV(10000, 0.50, 5, 'annually');
        expect(fv).toBeCloseTo(75937.50, 0);
    });
});

describe('calculateLumpsumFVReal', () => {
    it('should calculate inflation-adjusted FV', () => {
        // ₹25,000 at 12% for 10 years with 5% inflation
        const nominalFV = calculateLumpsumFV(25000, 0.12, 10, 'monthly');
        const realFV = calculateLumpsumFVReal(25000, 0.12, 10, 0.05, 'monthly');

        // Real FV should be less than nominal FV
        expect(realFV).toBeLessThan(nominalFV);

        // Real FV ≈ 82509.67 / (1.05)^10 ≈ 50,653.78
        expect(realFV).toBeCloseTo(50653.78, 0);
    });

    it('should equal nominal FV when inflation is 0', () => {
        const nominalFV = calculateLumpsumFV(25000, 0.12, 10, 'monthly');
        const realFV = calculateLumpsumFVReal(25000, 0.12, 10, 0, 'monthly');
        // Use toBeCloseTo for floating point comparison
        expect(realFV).toBeCloseTo(nominalFV, 2);
    });
});
