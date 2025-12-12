/**
 * Unit tests for SIP calculations
 */

import {
    calculateSIPFV,
    calculateSIPFVReal,
    calculateSIPTotalContributions,
    calculateSIPForGoal,
    getContributionsPerYear,
} from '../sip';

describe('getContributionsPerYear', () => {
    it('should return correct contributions per year', () => {
        expect(getContributionsPerYear('monthly')).toBe(12);
        expect(getContributionsPerYear('quarterly')).toBe(4);
        expect(getContributionsPerYear('annually')).toBe(1);
    });
});

describe('calculateSIPFV', () => {
    it('should calculate correct FV for monthly SIP', () => {
        // ₹5,000 monthly at 12% for 10 years
        // FV = 5000 × [((1 + 0.01)^120 - 1) / 0.01]
        // FV = 5000 × 230.0387 = 1,150,193.47
        const fv = calculateSIPFV(5000, 0.12, 10, 'monthly');
        expect(fv).toBeCloseTo(1150193.47, -1);
    });

    it('should calculate higher FV for start-of-period contributions', () => {
        const endOfPeriod = calculateSIPFV(5000, 0.12, 10, 'monthly', false);
        const startOfPeriod = calculateSIPFV(5000, 0.12, 10, 'monthly', true);

        // Start of period should be ~1% higher (one extra month of growth)
        expect(startOfPeriod).toBeGreaterThan(endOfPeriod);
        expect(startOfPeriod).toBeCloseTo(endOfPeriod * 1.01, -2);
    });

    it('should handle quarterly contributions', () => {
        // ₹15,000 quarterly at 10% for 5 years
        const fv = calculateSIPFV(15000, 0.10, 5, 'quarterly');
        expect(fv).toBeGreaterThan(15000 * 20); // More than total contributions
    });

    it('should return 0 when years is 0', () => {
        const fv = calculateSIPFV(5000, 0.12, 0, 'monthly');
        expect(fv).toBe(0);
    });

    it('should return 0 when contribution is 0', () => {
        const fv = calculateSIPFV(0, 0.12, 10, 'monthly');
        expect(fv).toBe(0);
    });

    it('should return sum of contributions when rate is 0', () => {
        const fv = calculateSIPFV(5000, 0, 10, 'monthly');
        expect(fv).toBe(5000 * 12 * 10); // 600,000
    });

    it('should handle very high contribution amounts', () => {
        const fv = calculateSIPFV(100000, 0.10, 20, 'monthly');
        expect(fv).toBeGreaterThan(100000 * 12 * 20);
    });
});

describe('calculateSIPTotalContributions', () => {
    it('should calculate correct total for monthly contributions', () => {
        const total = calculateSIPTotalContributions(5000, 10, 'monthly');
        expect(total).toBe(600000);
    });

    it('should calculate correct total for quarterly contributions', () => {
        const total = calculateSIPTotalContributions(15000, 5, 'quarterly');
        expect(total).toBe(300000);
    });
});

describe('calculateSIPFVReal', () => {
    it('should calculate inflation-adjusted SIP FV', () => {
        const nominalFV = calculateSIPFV(5000, 0.12, 10, 'monthly');
        const realFV = calculateSIPFVReal(5000, 0.12, 10, 0.05, 'monthly');

        expect(realFV).toBeLessThan(nominalFV);
    });
});

describe('calculateSIPForGoal', () => {
    it('should calculate required SIP for goal', () => {
        // Goal: ₹10,00,000 in 10 years at 12%
        const requiredSIP = calculateSIPForGoal(1000000, 0.12, 10, 'monthly');

        // Verify by calculating FV with this SIP
        const achievedFV = calculateSIPFV(requiredSIP, 0.12, 10, 'monthly');
        expect(achievedFV).toBeCloseTo(1000000, -1);
    });

    it('should return goal amount when years is 0', () => {
        const requiredSIP = calculateSIPForGoal(1000000, 0.12, 0, 'monthly');
        expect(requiredSIP).toBe(1000000);
    });

    it('should calculate simple division when rate is 0', () => {
        const requiredSIP = calculateSIPForGoal(120000, 0, 10, 'monthly');
        expect(requiredSIP).toBe(1000); // 120000 / (12 * 10)
    });
});
