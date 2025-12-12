/**
 * Unit tests for CAGR and rate calculations
 */

import {
    calculateCAGR,
    calculateRealRate,
    calculateNominalRate,
    calculateEffectiveAnnualRate,
    calculateYearsToDouble,
    calculateYearsToMultiplier,
} from '../cagr';

describe('calculateCAGR', () => {
    it('should calculate correct CAGR for growth', () => {
        // ₹10,000 to ₹25,937 in 10 years at 10% CAGR
        const cagr = calculateCAGR(10000, 25937.42, 10);
        expect(cagr).toBeCloseTo(0.10, 2);
    });

    it('should return 0 when years is 0', () => {
        const cagr = calculateCAGR(10000, 20000, 0);
        expect(cagr).toBe(0);
    });

    it('should return -1 for complete loss', () => {
        const cagr = calculateCAGR(10000, 0, 10);
        expect(cagr).toBe(-1);
    });

    it('should handle case when PV > FV (negative growth)', () => {
        const cagr = calculateCAGR(10000, 5000, 5);
        expect(cagr).toBeLessThan(0);
        expect(cagr).toBeCloseTo(-0.1294, 3);
    });

    it('should return Infinity when PV is 0 and FV is positive', () => {
        const cagr = calculateCAGR(0, 10000, 10);
        expect(cagr).toBe(Infinity);
    });
});

describe('calculateRealRate', () => {
    it('should calculate correct real rate', () => {
        // 12% nominal, 5% inflation
        // Real = (1.12 / 1.05) - 1 = 0.0667
        const real = calculateRealRate(0.12, 0.05);
        expect(real).toBeCloseTo(0.0667, 3);
    });

    it('should return nominal rate when inflation is 0', () => {
        const real = calculateRealRate(0.10, 0);
        expect(real).toBeCloseTo(0.10, 4);
    });

    it('should return negative when inflation > nominal', () => {
        const real = calculateRealRate(0.05, 0.08);
        expect(real).toBeLessThan(0);
    });

    it('should handle deflation (negative inflation)', () => {
        const real = calculateRealRate(0.05, -0.02);
        expect(real).toBeGreaterThan(0.05);
    });
});

describe('calculateNominalRate', () => {
    it('should be inverse of calculateRealRate', () => {
        const nominal = 0.12;
        const inflation = 0.05;
        const real = calculateRealRate(nominal, inflation);
        const backToNominal = calculateNominalRate(real, inflation);
        expect(backToNominal).toBeCloseTo(nominal, 3);
    });
});

describe('calculateEffectiveAnnualRate', () => {
    it('should calculate EAR for monthly compounding', () => {
        // 12% nominal, monthly compounding
        // EAR = (1 + 0.12/12)^12 - 1 = 0.1268
        const ear = calculateEffectiveAnnualRate(0.12, 12);
        expect(ear).toBeCloseTo(0.1268, 3);
    });

    it('should return nominal rate for annual compounding', () => {
        const ear = calculateEffectiveAnnualRate(0.10, 1);
        expect(ear).toBeCloseTo(0.10, 4);
    });

    it('should return nominal rate when periods is 0', () => {
        const ear = calculateEffectiveAnnualRate(0.10, 0);
        expect(ear).toBe(0.10);
    });
});

describe('calculateYearsToDouble', () => {
    it('should calculate years to double at 10%', () => {
        // Rule of 72 approximation: 72/10 = 7.2 years
        // Exact: ln(2)/ln(1.10) = 7.27 years
        const years = calculateYearsToDouble(0.10);
        expect(years).toBeCloseTo(7.27, 1);
    });

    it('should return Infinity for 0 rate', () => {
        const years = calculateYearsToDouble(0);
        expect(years).toBe(Infinity);
    });

    it('should return faster doubling for higher rates', () => {
        const at10 = calculateYearsToDouble(0.10);
        const at15 = calculateYearsToDouble(0.15);
        expect(at15).toBeLessThan(at10);
    });
});

describe('calculateYearsToMultiplier', () => {
    it('should calculate years to triple', () => {
        // 10% rate: ln(3)/ln(1.10) = 11.53 years
        const years = calculateYearsToMultiplier(0.10, 3);
        expect(years).toBeCloseTo(11.53, 1);
    });

    it('should return 0 when multiplier is 1 or less', () => {
        expect(calculateYearsToMultiplier(0.10, 1)).toBe(0);
        expect(calculateYearsToMultiplier(0.10, 0.5)).toBe(0);
    });

    it('should return Infinity for 0 rate', () => {
        const years = calculateYearsToMultiplier(0, 2);
        expect(years).toBe(Infinity);
    });
});
