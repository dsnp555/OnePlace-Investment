/**
 * Unit tests for portfolio functions
 */

import {
    validateAllocations,
    normalizeAllocations,
    calculateAllocatedAmounts,
    projectPortfolio,
} from '../portfolio';
import { Allocation, ProjectionParams } from '../types';

describe('validateAllocations', () => {
    it('should validate correct allocations', () => {
        const allocations: Allocation[] = [
            { category: 'Stocks', percent: 60, expectedAnnualReturn: 0.12 },
            { category: 'Bonds', percent: 40, expectedAnnualReturn: 0.07 },
        ];
        const result = validateAllocations(allocations);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject empty allocations', () => {
        const result = validateAllocations([]);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('At least one allocation is required');
    });

    it('should reject negative percentages', () => {
        const allocations: Allocation[] = [
            { category: 'Stocks', percent: -10, expectedAnnualReturn: 0.12 },
        ];
        const result = validateAllocations(allocations);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('negative'))).toBe(true);
    });

    it('should reject single allocation > 100%', () => {
        const allocations: Allocation[] = [
            { category: 'Stocks', percent: 150, expectedAnnualReturn: 0.12 },
        ];
        const result = validateAllocations(allocations);
        expect(result.valid).toBe(false);
    });

    it('should reject empty category name', () => {
        const allocations: Allocation[] = [
            { category: '', percent: 50, expectedAnnualReturn: 0.12 },
        ];
        const result = validateAllocations(allocations);
        expect(result.valid).toBe(false);
    });
});

describe('normalizeAllocations', () => {
    it('should normalize allocations summing to 130%', () => {
        const allocations: Allocation[] = [
            { category: 'Stocks', percent: 60, expectedAnnualReturn: 0.12 },
            { category: 'Bonds', percent: 40, expectedAnnualReturn: 0.07 },
            { category: 'Gold', percent: 30, expectedAnnualReturn: 0.06 },
        ];

        const result = normalizeAllocations(allocations, false);

        expect(result.success).toBe(true);
        expect(result.totalPercent).toBe(100);

        // 60/130 * 100 = 46.15%
        expect(result.allocations[0].percentNormalized).toBeCloseTo(46.15, 1);
        // 40/130 * 100 = 30.77%
        expect(result.allocations[1].percentNormalized).toBeCloseTo(30.77, 1);
        // 30/130 * 100 = 23.08%
        expect(result.allocations[2].percentNormalized).toBeCloseTo(23.08, 1);

        // Sum should be 100
        const sum = result.allocations.reduce((s, a) => s + (a.percentNormalized ?? 0), 0);
        expect(sum).toBeCloseTo(100, 0);
    });

    it('should fail strict mode when sum != 100', () => {
        const allocations: Allocation[] = [
            { category: 'Stocks', percent: 60, expectedAnnualReturn: 0.12 },
            { category: 'Bonds', percent: 30, expectedAnnualReturn: 0.07 },
        ];

        const result = normalizeAllocations(allocations, true);

        expect(result.success).toBe(false);
        expect(result.error).toContain('must sum to 100%');
    });

    it('should pass strict mode when sum = 100', () => {
        const allocations: Allocation[] = [
            { category: 'Stocks', percent: 60, expectedAnnualReturn: 0.12 },
            { category: 'Bonds', percent: 40, expectedAnnualReturn: 0.07 },
        ];

        const result = normalizeAllocations(allocations, true);

        expect(result.success).toBe(true);
        expect(result.allocations[0].percentNormalized).toBe(60);
        expect(result.allocations[1].percentNormalized).toBe(40);
    });

    it('should fail on empty allocations', () => {
        const result = normalizeAllocations([], false);
        expect(result.success).toBe(false);
    });

    it('should fail when total is 0', () => {
        const allocations: Allocation[] = [
            { category: 'Stocks', percent: 0, expectedAnnualReturn: 0.12 },
        ];
        const result = normalizeAllocations(allocations, false);
        expect(result.success).toBe(false);
    });
});

describe('calculateAllocatedAmounts', () => {
    it('should calculate correct amounts', () => {
        const allocations: Allocation[] = [
            { category: 'Stocks', percent: 60, percentNormalized: 60, expectedAnnualReturn: 0.12 },
            { category: 'Bonds', percent: 40, percentNormalized: 40, expectedAnnualReturn: 0.07 },
        ];

        const result = calculateAllocatedAmounts(100000, allocations);

        expect(result[0].amount).toBe(60000);
        expect(result[1].amount).toBe(40000);
    });

    it('should use percentNormalized when available', () => {
        const allocations: Allocation[] = [
            { category: 'Stocks', percent: 70, percentNormalized: 50, expectedAnnualReturn: 0.12 },
        ];

        const result = calculateAllocatedAmounts(100000, allocations);
        expect(result[0].amount).toBe(50000);
    });
});

describe('projectPortfolio', () => {
    it('should project lumpsum portfolio correctly', () => {
        const params: ProjectionParams = {
            mode: 'lumpsum',
            amount: 100000,
            durationYears: 10,
            compounding: 'monthly',
            allocations: [
                { category: 'Stocks', percent: 60, expectedAnnualReturn: 0.12 },
                { category: 'Bonds', percent: 40, expectedAnnualReturn: 0.07 },
            ],
            normalize: false,
        };

        const result = projectPortfolio(params);

        expect(result.normalizedAllocations).toHaveLength(2);
        expect(result.aggregate.totalContributions).toBe(100000);
        expect(result.aggregate.futureValue).toBeGreaterThan(100000);
        expect(result.yearlyBreakdown).toHaveLength(10);
    });

    it('should normalize allocations when normalize=true', () => {
        const params: ProjectionParams = {
            mode: 'lumpsum',
            amount: 100000,
            durationYears: 5,
            compounding: 'monthly',
            allocations: [
                { category: 'Stocks', percent: 60, expectedAnnualReturn: 0.12 },
                { category: 'Bonds', percent: 40, expectedAnnualReturn: 0.07 },
                { category: 'Gold', percent: 30, expectedAnnualReturn: 0.06 },
            ],
            normalize: true,
        };

        const result = projectPortfolio(params);

        // Check normalized percentages
        const totalPercent = result.normalizedAllocations.reduce(
            (s, a) => s + a.percentNormalized, 0
        );
        expect(totalPercent).toBeCloseTo(100, 0);

        // Check amounts sum to initial investment
        const totalAmount = result.normalizedAllocations.reduce(
            (s, a) => s + a.amount, 0
        );
        expect(totalAmount).toBeCloseTo(100000, 0);
    });

    it('should calculate SIP portfolio correctly', () => {
        const params: ProjectionParams = {
            mode: 'sip',
            amount: 10000, // Monthly SIP
            durationYears: 10,
            compounding: 'monthly',
            allocations: [
                { category: 'Mutual Funds', percent: 100, expectedAnnualReturn: 0.10 },
            ],
            normalize: false,
        };

        const result = projectPortfolio(params);

        // SIP total contributions = 10000 * 12 * 10 = 1,200,000
        expect(result.aggregate.totalContributions).toBe(1200000);
        expect(result.aggregate.futureValue).toBeGreaterThan(1200000);
        expect(result.aggregate.totalReturns).toBeGreaterThan(0);
    });

    it('should apply inflation adjustment', () => {
        const params: ProjectionParams = {
            mode: 'lumpsum',
            amount: 100000,
            durationYears: 10,
            compounding: 'monthly',
            allocations: [
                { category: 'Stocks', percent: 100, expectedAnnualReturn: 0.12 },
            ],
            normalize: false,
            inflationRate: 0.05,
        };

        const result = projectPortfolio(params);

        expect(result.aggregate.realFutureValue).toBeDefined();
        expect(result.aggregate.realFutureValue!).toBeLessThan(result.aggregate.futureValue);
        expect(result.yearlyBreakdown[0].inflationAdjusted).toBeDefined();
    });

    it('should throw error for invalid allocations with strict mode', () => {
        const params: ProjectionParams = {
            mode: 'lumpsum',
            amount: 100000,
            durationYears: 10,
            compounding: 'monthly',
            allocations: [
                { category: 'Stocks', percent: 60, expectedAnnualReturn: 0.12 },
            ],
            normalize: false, // Strict mode (must sum to 100)
        };

        expect(() => projectPortfolio(params)).toThrow();
    });

    it('should generate correct yearly breakdown', () => {
        const params: ProjectionParams = {
            mode: 'lumpsum',
            amount: 100000,
            durationYears: 5,
            compounding: 'monthly',
            allocations: [
                { category: 'Stocks', percent: 100, expectedAnnualReturn: 0.10 },
            ],
            normalize: false,
        };

        const result = projectPortfolio(params);

        expect(result.yearlyBreakdown).toHaveLength(5);
        expect(result.yearlyBreakdown[0].year).toBe(1);
        expect(result.yearlyBreakdown[0].startBalance).toBe(100000);
        expect(result.yearlyBreakdown[4].endBalance).toBeCloseTo(
            result.aggregate.futureValue, 0
        );

        // Each year's end balance should be next year's start balance
        for (let i = 0; i < 4; i++) {
            expect(result.yearlyBreakdown[i + 1].startBalance).toBeCloseTo(
                result.yearlyBreakdown[i].endBalance, 0
            );
        }
    });
});
