/**
 * SIP (Systematic Investment Plan) Future Value Calculations
 * 
 * Formula (end-of-period contributions):
 * FV = A × [((1 + i)^N - 1) / i]
 * 
 * Formula (start-of-period contributions):
 * FV = A × [((1 + i)^N - 1) / i] × (1 + i)
 * 
 * Where:
 *   A = Regular contribution amount
 *   i = Periodic interest rate (r/m)
 *   N = Total number of periods (m × t)
 *   m = Contributions per year
 *   t = Time in years
 */

import { CompoundingFrequency } from './types';
import { getCompoundingPeriods } from './lumpsum';

export type ContributionFrequency = 'monthly' | 'quarterly' | 'annually';

/**
 * Get contributions per year based on frequency
 */
export function getContributionsPerYear(frequency: ContributionFrequency): number {
    switch (frequency) {
        case 'monthly':
            return 12;
        case 'quarterly':
            return 4;
        case 'annually':
            return 1;
        default:
            return 12;
    }
}

/**
 * Calculate SIP future value
 * 
 * @param contribution - Regular contribution amount (per period)
 * @param annualRate - Annual interest rate as decimal (e.g., 0.12 for 12%)
 * @param years - Investment duration in years
 * @param contributionFrequency - How often contributions are made
 * @param contributionAtStart - Whether contributions are made at start of period
 * @returns Future value of SIP investment
 * 
 * @example
 * // ₹5,000 monthly SIP at 12% for 10 years
 * calculateSIPFV(5000, 0.12, 10, 'monthly')
 * // Returns: 1,161,695.42 (approximately)
 */
export function calculateSIPFV(
    contribution: number,
    annualRate: number,
    years: number,
    contributionFrequency: ContributionFrequency = 'monthly',
    contributionAtStart: boolean = false
): number {
    // Edge case: zero years
    if (years === 0) {
        return 0;
    }

    // Edge case: zero or negative contribution
    if (contribution <= 0) {
        return 0;
    }

    // Edge case: zero rate (simple sum of contributions)
    if (annualRate === 0) {
        const periodsPerYear = getContributionsPerYear(contributionFrequency);
        return contribution * periodsPerYear * years;
    }

    const m = getContributionsPerYear(contributionFrequency);
    const i = annualRate / m; // Periodic rate
    const n = m * years; // Total periods

    // FV = A × [((1 + i)^N - 1) / i]
    let fv = contribution * ((Math.pow(1 + i, n) - 1) / i);

    // If contributions at start of period, multiply by (1 + i)
    if (contributionAtStart) {
        fv *= (1 + i);
    }

    return Math.round(fv * 100) / 100;
}

/**
 * Calculate total contributions for SIP
 */
export function calculateSIPTotalContributions(
    contribution: number,
    years: number,
    contributionFrequency: ContributionFrequency = 'monthly'
): number {
    const periodsPerYear = getContributionsPerYear(contributionFrequency);
    return contribution * periodsPerYear * years;
}

/**
 * Calculate SIP future value with inflation adjustment
 * 
 * @param contribution - Regular contribution amount (per period)
 * @param annualRate - Nominal annual interest rate as decimal
 * @param years - Investment duration in years
 * @param inflationRate - Annual inflation rate as decimal
 * @param contributionFrequency - How often contributions are made
 * @param contributionAtStart - Whether contributions are made at start of period
 * @returns Inflation-adjusted future value
 */
export function calculateSIPFVReal(
    contribution: number,
    annualRate: number,
    years: number,
    inflationRate: number,
    contributionFrequency: ContributionFrequency = 'monthly',
    contributionAtStart: boolean = false
): number {
    const nominalFV = calculateSIPFV(
        contribution,
        annualRate,
        years,
        contributionFrequency,
        contributionAtStart
    );

    // Discount by inflation
    const inflationFactor = Math.pow(1 + inflationRate, years);
    const realFV = nominalFV / inflationFactor;

    return Math.round(realFV * 100) / 100;
}

/**
 * Calculate SIP required to reach a goal
 * 
 * @param goalAmount - Target future value
 * @param annualRate - Annual interest rate as decimal
 * @param years - Investment duration in years
 * @param contributionFrequency - How often contributions are made
 * @returns Required contribution amount per period
 */
export function calculateSIPForGoal(
    goalAmount: number,
    annualRate: number,
    years: number,
    contributionFrequency: ContributionFrequency = 'monthly'
): number {
    if (years === 0 || goalAmount <= 0) {
        return goalAmount;
    }

    if (annualRate === 0) {
        const periodsPerYear = getContributionsPerYear(contributionFrequency);
        return goalAmount / (periodsPerYear * years);
    }

    const m = getContributionsPerYear(contributionFrequency);
    const i = annualRate / m;
    const n = m * years;

    // A = FV × i / ((1 + i)^N - 1)
    const contribution = goalAmount * i / (Math.pow(1 + i, n) - 1);

    return Math.round(contribution * 100) / 100;
}
