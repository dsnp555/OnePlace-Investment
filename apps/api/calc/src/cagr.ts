/**
 * CAGR and Rate Calculations
 * 
 * CAGR (Compound Annual Growth Rate):
 * CAGR = (FV / PV)^(1/t) - 1
 * 
 * Real Rate (inflation-adjusted):
 * realRate = (1 + nominalRate) / (1 + inflation) - 1
 */

/**
 * Calculate Compound Annual Growth Rate
 * 
 * @param presentValue - Initial investment value
 * @param futureValue - Final investment value
 * @param years - Time period in years
 * @returns CAGR as decimal (e.g., 0.12 for 12%)
 * 
 * @example
 * calculateCAGR(25000, 82262.47, 10) // Returns: 0.1268 (approximately 12.68%)
 */
export function calculateCAGR(
    presentValue: number,
    futureValue: number,
    years: number
): number {
    // Edge cases
    if (years === 0) {
        return 0;
    }

    if (presentValue === 0) {
        return futureValue > 0 ? Infinity : 0;
    }

    if (futureValue <= 0) {
        return -1; // 100% loss
    }

    // CAGR = (FV / PV)^(1/t) - 1
    const cagr = Math.pow(futureValue / presentValue, 1 / years) - 1;

    return Math.round(cagr * 10000) / 10000; // Round to 4 decimal places
}

/**
 * Calculate real (inflation-adjusted) rate of return
 * 
 * Formula: realRate = (1 + nominalRate) / (1 + inflationRate) - 1
 * 
 * @param nominalRate - Nominal annual rate as decimal
 * @param inflationRate - Annual inflation rate as decimal
 * @returns Real rate as decimal
 * 
 * @example
 * calculateRealRate(0.12, 0.05) // Returns: 0.0667 (approximately 6.67%)
 */
export function calculateRealRate(
    nominalRate: number,
    inflationRate: number
): number {
    // Edge case: deflation or zero inflation
    if (inflationRate === -1) {
        return Infinity;
    }

    const realRate = (1 + nominalRate) / (1 + inflationRate) - 1;

    return Math.round(realRate * 10000) / 10000;
}

/**
 * Calculate nominal rate from real rate and inflation
 * 
 * Formula: nominalRate = (1 + realRate) × (1 + inflationRate) - 1
 * 
 * @param realRate - Real annual rate as decimal
 * @param inflationRate - Annual inflation rate as decimal
 * @returns Nominal rate as decimal
 */
export function calculateNominalRate(
    realRate: number,
    inflationRate: number
): number {
    const nominalRate = (1 + realRate) * (1 + inflationRate) - 1;
    return Math.round(nominalRate * 10000) / 10000;
}

/**
 * Calculate effective annual rate from nominal rate
 * 
 * Formula: EAR = (1 + r/n)^n - 1
 * 
 * @param nominalRate - Nominal annual rate as decimal
 * @param compoundingPeriods - Number of compounding periods per year
 * @returns Effective annual rate as decimal
 */
export function calculateEffectiveAnnualRate(
    nominalRate: number,
    compoundingPeriods: number
): number {
    if (compoundingPeriods === 0) {
        return nominalRate;
    }

    const ear = Math.pow(1 + nominalRate / compoundingPeriods, compoundingPeriods) - 1;
    return Math.round(ear * 10000) / 10000;
}

/**
 * Calculate years to double investment (Rule of 72 approximation)
 * 
 * @param annualRate - Annual rate as decimal
 * @returns Approximate years to double
 */
export function calculateYearsToDouble(annualRate: number): number {
    if (annualRate <= 0) {
        return Infinity;
    }

    // More accurate formula: ln(2) / ln(1 + r)
    const years = Math.log(2) / Math.log(1 + annualRate);
    return Math.round(years * 100) / 100;
}

/**
 * Calculate years to reach a target multiplier
 * 
 * @param annualRate - Annual rate as decimal
 * @param multiplier - Target multiplier (e.g., 3 for tripling)
 * @returns Years to reach target
 */
export function calculateYearsToMultiplier(
    annualRate: number,
    multiplier: number
): number {
    if (annualRate <= 0 || multiplier <= 1) {
        return multiplier <= 1 ? 0 : Infinity;
    }

    const years = Math.log(multiplier) / Math.log(1 + annualRate);
    return Math.round(years * 100) / 100;
}
