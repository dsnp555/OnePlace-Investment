/**
 * Monte Carlo Simulation for Investment Projections
 * 
 * Provides probabilistic projections by simulating thousands of possible
 * outcomes based on expected returns and volatility (standard deviation).
 * Returns confidence intervals showing best/worst case scenarios.
 */

import { CompoundingFrequency } from './types';
import { getCompoundingPeriods } from './lumpsum';

/**
 * Monte Carlo simulation parameters
 */
export interface MonteCarloParams {
    /** Investment mode */
    mode: 'lumpsum' | 'sip';
    /** Initial amount (lumpsum) or monthly contribution (SIP) */
    amount: number;
    /** Investment duration in years */
    durationYears: number;
    /** Expected annual return (decimal, e.g., 0.12 for 12%) */
    expectedReturn: number;
    /** Standard deviation of returns (volatility, decimal, e.g., 0.15 for 15%) */
    volatility: number;
    /** Number of simulations to run (default: 1000) */
    simulations?: number;
    /** Compounding frequency */
    compounding?: CompoundingFrequency;
    /** Optional inflation rate for real returns */
    inflationRate?: number;
}

/**
 * Result of a single simulation run
 */
export interface SimulationResult {
    /** Final portfolio value */
    finalValue: number;
    /** Yearly values for this simulation path */
    yearlyValues: number[];
    /** CAGR achieved in this simulation */
    cagr: number;
}

/**
 * Confidence interval at a specific percentile
 */
export interface ConfidenceInterval {
    /** Percentile (e.g., 10, 25, 50, 75, 90) */
    percentile: number;
    /** Portfolio value at this percentile */
    value: number;
}

/**
 * Complete Monte Carlo simulation results
 */
export interface MonteCarloResult {
    /** Number of simulations run */
    simulationCount: number;
    /** All simulation final values (sorted ascending) */
    finalValues: number[];
    /** Statistical summary */
    statistics: {
        mean: number;
        median: number;
        min: number;
        max: number;
        standardDeviation: number;
    };
    /** Key percentile values */
    percentiles: {
        p10: number;  // 10th percentile (bad case)
        p25: number;  // 25th percentile
        p50: number;  // 50th percentile (median)
        p75: number;  // 75th percentile
        p90: number;  // 90th percentile (good case)
    };
    /** Confidence intervals for charting */
    confidenceIntervals: ConfidenceInterval[];
    /** Probability of achieving target (if specified) */
    probabilityMetrics: {
        /** Probability of at least doubling investment */
        probDouble: number;
        /** Probability of losing money (FV < principal) */
        probLoss: number;
    };
    /** Yearly percentile bands for visualization */
    yearlyBands: {
        year: number;
        p10: number;
        p25: number;
        p50: number;
        p75: number;
        p90: number;
    }[];
}

/**
 * Generate a random return based on normal distribution
 * Uses Box-Muller transform for normal distribution
 */
function generateRandomReturn(mean: number, stdDev: number): number {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z;
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArr: number[], p: number): number {
    if (sortedArr.length === 0) return 0;
    const index = (p / 100) * (sortedArr.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sortedArr[lower];
    return sortedArr[lower] + (sortedArr[upper] - sortedArr[lower]) * (index - lower);
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
}

/**
 * Run Monte Carlo simulation for investment projections
 * 
 * @param params - Simulation parameters
 * @returns Complete simulation results with statistics and confidence intervals
 * 
 * @example
 * ```typescript
 * const result = runMonteCarloSimulation({
 *   mode: 'sip',
 *   amount: 10000,           // ₹10,000/month
 *   durationYears: 10,
 *   expectedReturn: 0.12,    // 12% expected
 *   volatility: 0.18,        // 18% standard deviation
 *   simulations: 1000,
 * });
 * 
 * console.log(`Median outcome: ₹${result.percentiles.p50}`);
 * console.log(`10% chance of less than: ₹${result.percentiles.p10}`);
 * console.log(`10% chance of more than: ₹${result.percentiles.p90}`);
 * ```
 */
export function runMonteCarloSimulation(params: MonteCarloParams): MonteCarloResult {
    const {
        mode,
        amount,
        durationYears,
        expectedReturn,
        volatility,
        simulations = 1000,
        compounding = 'monthly',
        inflationRate,
    } = params;

    const periodsPerYear = getCompoundingPeriods(compounding);
    const periodReturn = expectedReturn / periodsPerYear;
    const periodVolatility = volatility / Math.sqrt(periodsPerYear);
    const totalPeriods = durationYears * periodsPerYear;

    // Store all simulation results
    const allFinalValues: number[] = [];
    const allYearlyValues: number[][] = Array.from({ length: durationYears }, () => []);

    // Calculate total contributions for probability metrics
    const totalContributions = mode === 'lumpsum'
        ? amount
        : amount * periodsPerYear * durationYears;

    // Run simulations
    for (let sim = 0; sim < simulations; sim++) {
        let balance = mode === 'lumpsum' ? amount : 0;
        const yearlyValues: number[] = [];

        for (let period = 1; period <= totalPeriods; period++) {
            // Add SIP contribution at start of period
            if (mode === 'sip') {
                balance += amount;
            }

            // Apply random return for this period
            const randomReturn = generateRandomReturn(periodReturn, periodVolatility);
            balance *= (1 + randomReturn);

            // Record yearly values
            if (period % periodsPerYear === 0) {
                const year = period / periodsPerYear;
                let yearEndValue = balance;

                // Apply inflation adjustment if specified
                if (inflationRate !== undefined) {
                    yearEndValue = balance / Math.pow(1 + inflationRate, year);
                }

                yearlyValues.push(yearEndValue);
                allYearlyValues[year - 1].push(yearEndValue);
            }
        }

        // Apply inflation to final value if specified
        let finalValue = balance;
        if (inflationRate !== undefined) {
            finalValue = balance / Math.pow(1 + inflationRate, durationYears);
        }

        allFinalValues.push(finalValue);
    }

    // Sort for percentile calculations
    allFinalValues.sort((a, b) => a - b);

    // Calculate statistics
    const mean = allFinalValues.reduce((a, b) => a + b, 0) / allFinalValues.length;
    const median = percentile(allFinalValues, 50);
    const min = allFinalValues[0];
    const max = allFinalValues[allFinalValues.length - 1];
    const stdDev = standardDeviation(allFinalValues, mean);

    // Calculate percentiles
    const p10 = percentile(allFinalValues, 10);
    const p25 = percentile(allFinalValues, 25);
    const p50 = median;
    const p75 = percentile(allFinalValues, 75);
    const p90 = percentile(allFinalValues, 90);

    // Confidence intervals
    const confidenceIntervals: ConfidenceInterval[] = [
        { percentile: 5, value: percentile(allFinalValues, 5) },
        { percentile: 10, value: p10 },
        { percentile: 25, value: p25 },
        { percentile: 50, value: p50 },
        { percentile: 75, value: p75 },
        { percentile: 90, value: p90 },
        { percentile: 95, value: percentile(allFinalValues, 95) },
    ];

    // Probability metrics
    const probDouble = allFinalValues.filter(v => v >= totalContributions * 2).length / simulations;
    const probLoss = allFinalValues.filter(v => v < totalContributions).length / simulations;

    // Yearly bands for visualization
    const yearlyBands = allYearlyValues.map((yearValues, idx) => {
        yearValues.sort((a, b) => a - b);
        return {
            year: idx + 1,
            p10: percentile(yearValues, 10),
            p25: percentile(yearValues, 25),
            p50: percentile(yearValues, 50),
            p75: percentile(yearValues, 75),
            p90: percentile(yearValues, 90),
        };
    });

    return {
        simulationCount: simulations,
        finalValues: allFinalValues,
        statistics: {
            mean: Math.round(mean * 100) / 100,
            median: Math.round(median * 100) / 100,
            min: Math.round(min * 100) / 100,
            max: Math.round(max * 100) / 100,
            standardDeviation: Math.round(stdDev * 100) / 100,
        },
        percentiles: {
            p10: Math.round(p10 * 100) / 100,
            p25: Math.round(p25 * 100) / 100,
            p50: Math.round(p50 * 100) / 100,
            p75: Math.round(p75 * 100) / 100,
            p90: Math.round(p90 * 100) / 100,
        },
        confidenceIntervals,
        probabilityMetrics: {
            probDouble: Math.round(probDouble * 1000) / 10, // Percentage
            probLoss: Math.round(probLoss * 1000) / 10,
        },
        yearlyBands,
    };
}

/**
 * Default volatility estimates by asset category
 * Based on historical standard deviations
 */
export const DEFAULT_VOLATILITY: Record<string, number> = {
    stocks: 0.20,           // 20% - High volatility
    mutual_funds: 0.15,     // 15% - Medium-high
    etfs: 0.16,             // 16% - Similar to mutual funds
    index_funds: 0.15,      // 15% - Market volatility
    reits: 0.18,            // 18% - High volatility
    gold: 0.12,             // 12% - Medium volatility
    silver: 0.22,           // 22% - Very high volatility
    bonds: 0.06,            // 6% - Low volatility
    fixed_deposits: 0.01,   // 1% - Very low (rate changes only)
    cash: 0.02,             // 2% - Very low
    crypto: 0.60,           // 60% - Extreme volatility
    real_estate: 0.10,      // 10% - Medium-low
    p2p: 0.15,              // 15% - Medium-high (default risk)
    ppf: 0.01,              // 1% - Very low (government backed)
    nps: 0.12,              // 12% - Medium (mixed assets)
};

/**
 * Get volatility estimate for a category
 */
export function getDefaultVolatility(category: string): number {
    const key = category.toLowerCase().replace(/\s+/g, '_');
    return DEFAULT_VOLATILITY[key] ?? 0.15; // Default 15%
}

/**
 * Calculate portfolio-weighted volatility
 * Uses simple weighted average (ignores correlation for simplicity)
 */
export function calculatePortfolioVolatility(
    allocations: { category: string; percent: number }[]
): number {
    const totalPercent = allocations.reduce((sum, a) => sum + a.percent, 0);
    if (totalPercent === 0) return 0.15;

    let weightedVolatility = 0;
    for (const alloc of allocations) {
        const weight = alloc.percent / totalPercent;
        const volatility = getDefaultVolatility(alloc.category);
        weightedVolatility += weight * volatility;
    }

    return Math.round(weightedVolatility * 1000) / 1000;
}
