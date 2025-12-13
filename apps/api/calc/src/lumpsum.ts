/**
 * Lump-sum Future Value Calculations
 * 
 * Formula: FV = P × (1 + r/n)^(n × t)
 * Where:
 *   P = Principal (initial investment)
 *   r = Annual interest rate (decimal)
 *   n = Compounding frequency per year
 *   t = Time in years
 */

import { CompoundingFrequency } from './types';

/**
 * Get the number of compounding periods per year
 */
export function getCompoundingPeriods(frequency: CompoundingFrequency): number {
    switch (frequency) {
        case 'daily':
            return 365;
        case 'monthly':
            return 12;
        case 'quarterly':
            return 4;
        case 'annually':
            return 1;
        default:
            return 12; // Default to monthly
    }
}

/**
 * Calculate lump-sum future value with compound interest
 * 
 * @param principal - Initial investment amount
 * @param annualRate - Annual interest rate as decimal (e.g., 0.12 for 12%)
 * @param years - Investment duration in years
 * @param compoundingFrequency - How often interest is compounded
 * @returns Future value of the investment
 * 
 * @example
 * // ₹25,000 at 12% for 10 years, monthly compounding
 * calculateLumpsumFV(25000, 0.12, 10, 'monthly')
 * // Returns: 82262.47 (approximately)
 */
export function calculateLumpsumFV(
    principal: number,
    annualRate: number,
    years: number,
    compoundingFrequency: CompoundingFrequency = 'monthly'
): number {
    // Edge case: zero years
    if (years === 0) {
        return principal;
    }

    // Edge case: zero or negative principal
    if (principal <= 0) {
        return 0;
    }

    // Edge case: zero rate
    if (annualRate === 0) {
        return principal;
    }

    const n = getCompoundingPeriods(compoundingFrequency);
    const rate = annualRate / n;
    const periods = n * years;

    // FV = P × (1 + r/n)^(n × t)
    const fv = principal * Math.pow(1 + rate, periods);

    return Math.round(fv * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate lump-sum future value with inflation adjustment
 * 
 * @param principal - Initial investment amount
 * @param annualRate - Nominal annual interest rate as decimal
 * @param years - Investment duration in years
 * @param inflationRate - Annual inflation rate as decimal
 * @param compoundingFrequency - How often interest is compounded
 * @returns Inflation-adjusted future value
 */
export function calculateLumpsumFVReal(
    principal: number,
    annualRate: number,
    years: number,
    inflationRate: number,
    compoundingFrequency: CompoundingFrequency = 'monthly'
): number {
    const nominalFV = calculateLumpsumFV(principal, annualRate, years, compoundingFrequency);

    // Discount by inflation: Real FV = Nominal FV / (1 + inflation)^years
    const inflationFactor = Math.pow(1 + inflationRate, years);
    const realFV = nominalFV / inflationFactor;

    return Math.round(realFV * 100) / 100;
}
