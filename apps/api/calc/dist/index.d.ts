/**
 * Investment calculation types and interfaces
 */
/** Investment mode types */
type InvestmentMode = 'lumpsum' | 'sip' | 'goal' | 'withdrawal';
/** Compounding frequency */
type CompoundingFrequency = 'daily' | 'monthly' | 'quarterly' | 'annually';
/** Risk profile types */
type RiskProfile = 'conservative' | 'balanced' | 'aggressive';
/** Asset category */
interface AssetCategory {
    id: string;
    name: string;
    defaultExpectedReturn: number;
    riskLevel: 'low' | 'medium' | 'high';
}
/** Allocation for a single category */
interface Allocation {
    category: string;
    percent: number;
    percentNormalized?: number;
    amount?: number;
    expectedAnnualReturn: number;
}
/** Projection parameters */
interface ProjectionParams {
    mode: InvestmentMode;
    amount: number;
    durationYears: number;
    compounding: CompoundingFrequency;
    allocations: Allocation[];
    normalize: boolean;
    inflationRate?: number;
    taxPercent?: number;
}
/** Per-category projection result */
interface CategoryProjection {
    category: string;
    percentNormalized: number;
    amount: number;
    projectedFV: number;
    totalContributions: number;
    totalReturns: number;
    cagr: number;
    realFV?: number;
}
/** Yearly breakdown entry */
interface YearlyBreakdown {
    year: number;
    startBalance: number;
    contributions: number;
    interest: number;
    endBalance: number;
    inflationAdjusted?: number;
}
/** Full portfolio projection result */
interface PortfolioProjection {
    strategyId?: string;
    normalizedAllocations: CategoryProjection[];
    aggregate: {
        futureValue: number;
        totalContributions: number;
        totalReturns: number;
        cagr: number;
        realFutureValue?: number;
    };
    yearlyBreakdown: YearlyBreakdown[];
}
/** Normalization result */
interface NormalizationResult {
    success: boolean;
    allocations: Allocation[];
    totalPercent: number;
    error?: string;
}
/** Risk questionnaire answer */
interface RiskQuestionnaireAnswer {
    questionId: string;
    score: number;
}
/** Risk assessment result */
interface RiskAssessment {
    profile: RiskProfile;
    score: number;
    suggestedAllocations: Allocation[];
}

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

/**
 * Get the number of compounding periods per year
 */
declare function getCompoundingPeriods(frequency: CompoundingFrequency): number;
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
declare function calculateLumpsumFV(principal: number, annualRate: number, years: number, compoundingFrequency?: CompoundingFrequency): number;
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
declare function calculateLumpsumFVReal(principal: number, annualRate: number, years: number, inflationRate: number, compoundingFrequency?: CompoundingFrequency): number;

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
type ContributionFrequency = 'monthly' | 'quarterly' | 'annually';
/**
 * Get contributions per year based on frequency
 */
declare function getContributionsPerYear(frequency: ContributionFrequency): number;
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
declare function calculateSIPFV(contribution: number, annualRate: number, years: number, contributionFrequency?: ContributionFrequency, contributionAtStart?: boolean): number;
/**
 * Calculate total contributions for SIP
 */
declare function calculateSIPTotalContributions(contribution: number, years: number, contributionFrequency?: ContributionFrequency): number;
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
declare function calculateSIPFVReal(contribution: number, annualRate: number, years: number, inflationRate: number, contributionFrequency?: ContributionFrequency, contributionAtStart?: boolean): number;
/**
 * Calculate SIP required to reach a goal
 *
 * @param goalAmount - Target future value
 * @param annualRate - Annual interest rate as decimal
 * @param years - Investment duration in years
 * @param contributionFrequency - How often contributions are made
 * @returns Required contribution amount per period
 */
declare function calculateSIPForGoal(goalAmount: number, annualRate: number, years: number, contributionFrequency?: ContributionFrequency): number;

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
declare function calculateCAGR(presentValue: number, futureValue: number, years: number): number;
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
declare function calculateRealRate(nominalRate: number, inflationRate: number): number;
/**
 * Calculate nominal rate from real rate and inflation
 *
 * Formula: nominalRate = (1 + realRate) × (1 + inflationRate) - 1
 *
 * @param realRate - Real annual rate as decimal
 * @param inflationRate - Annual inflation rate as decimal
 * @returns Nominal rate as decimal
 */
declare function calculateNominalRate(realRate: number, inflationRate: number): number;
/**
 * Calculate effective annual rate from nominal rate
 *
 * Formula: EAR = (1 + r/n)^n - 1
 *
 * @param nominalRate - Nominal annual rate as decimal
 * @param compoundingPeriods - Number of compounding periods per year
 * @returns Effective annual rate as decimal
 */
declare function calculateEffectiveAnnualRate(nominalRate: number, compoundingPeriods: number): number;
/**
 * Calculate years to double investment (Rule of 72 approximation)
 *
 * @param annualRate - Annual rate as decimal
 * @returns Approximate years to double
 */
declare function calculateYearsToDouble(annualRate: number): number;
/**
 * Calculate years to reach a target multiplier
 *
 * @param annualRate - Annual rate as decimal
 * @param multiplier - Target multiplier (e.g., 3 for tripling)
 * @returns Years to reach target
 */
declare function calculateYearsToMultiplier(annualRate: number, multiplier: number): number;

/**
 * Portfolio Allocation and Projection Functions
 *
 * Handles:
 * - Normalization of allocations to sum to 100%
 * - Per-category projections
 * - Aggregate portfolio projections
 * - Yearly breakdowns
 */

/**
 * Validate allocations for errors
 */
declare function validateAllocations(allocations: Allocation[]): {
    valid: boolean;
    errors: string[];
};
/**
 * Normalize allocations to sum to 100%
 *
 * @param allocations - Array of allocations with user-input percentages
 * @param strict - If true, return error when sum != 100; if false, auto-normalize
 * @returns Normalized allocations
 */
declare function normalizeAllocations(allocations: Allocation[], strict?: boolean): NormalizationResult;
/**
 * Calculate allocated amounts for each category
 */
declare function calculateAllocatedAmounts(totalAmount: number, allocations: Allocation[]): Allocation[];
/**
 * Project portfolio future value across all categories
 *
 * @param params - Projection parameters
 * @returns Complete portfolio projection with per-category and aggregate results
 */
declare function projectPortfolio(params: ProjectionParams): PortfolioProjection;

/**
 * Risk Assessment and Default Allocations
 *
 * Provides:
 * - Risk questionnaire scoring
 * - Risk profile determination
 * - Default allocation presets by risk profile
 * - Default expected returns by asset category
 */

/**
 * Default asset categories with expected returns and risk levels
 * Returns are historical averages adjusted for Indian market context
 */
declare const DEFAULT_ASSET_CATEGORIES: AssetCategory[];
/**
 * Get default expected return for a category
 */
declare function getDefaultExpectedReturn(category: string): number;
/**
 * Default allocation presets by risk profile
 */
declare const ALLOCATION_PRESETS: Record<RiskProfile, Allocation[]>;
/**
 * Risk questionnaire questions with weights
 */
declare const RISK_QUESTIONS: {
    id: string;
    question: string;
    options: {
        value: number;
        label: string;
    }[];
    weight: number;
}[];
/**
 * Calculate risk score from questionnaire answers
 *
 * @param answers - Array of question answers with scores
 * @returns Risk score from 0-100
 */
declare function calculateRiskScore(answers: RiskQuestionnaireAnswer[]): number;
/**
 * Determine risk profile from score
 *
 * @param score - Risk score from 0-100
 * @returns Risk profile
 */
declare function getRiskProfile(score: number): RiskProfile;
/**
 * Get complete risk assessment from questionnaire answers
 *
 * @param answers - Array of question answers
 * @returns Complete risk assessment with profile and suggested allocations
 */
declare function assessRisk(answers: RiskQuestionnaireAnswer[]): RiskAssessment;
/**
 * Calculate emergency fund recommendation
 *
 * @param monthlyExpenses - Monthly expenses amount
 * @param riskProfile - User's risk profile
 * @returns Recommended emergency fund amount
 */
declare function calculateEmergencyFund(monthlyExpenses: number, riskProfile: RiskProfile): {
    minimum: number;
    recommended: number;
    ideal: number;
};
/**
 * Calculate FIRE number (Financial Independence Retire Early target)
 *
 * @param annualExpenses - Expected annual expenses in retirement
 * @param withdrawalRate - Safe withdrawal rate (default 4%)
 * @returns FIRE target amount
 */
declare function calculateFIRENumber(annualExpenses: number, withdrawalRate?: number): number;
/**
 * Estimate years to FIRE
 *
 * @param currentSavings - Current investment portfolio value
 * @param monthlyContribution - Monthly savings/investment amount
 * @param expectedReturn - Expected annual return (decimal)
 * @param fireNumber - Target FIRE number
 * @returns Estimated years to reach FIRE
 */
declare function estimateYearsToFIRE(currentSavings: number, monthlyContribution: number, expectedReturn: number, fireNumber: number): number;

/**
 * Monte Carlo Simulation for Investment Projections
 *
 * Provides probabilistic projections by simulating thousands of possible
 * outcomes based on expected returns and volatility (standard deviation).
 * Returns confidence intervals showing best/worst case scenarios.
 */

/**
 * Monte Carlo simulation parameters
 */
interface MonteCarloParams {
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
interface SimulationResult {
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
interface ConfidenceInterval {
    /** Percentile (e.g., 10, 25, 50, 75, 90) */
    percentile: number;
    /** Portfolio value at this percentile */
    value: number;
}
/**
 * Complete Monte Carlo simulation results
 */
interface MonteCarloResult {
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
        p10: number;
        p25: number;
        p50: number;
        p75: number;
        p90: number;
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
declare function runMonteCarloSimulation(params: MonteCarloParams): MonteCarloResult;
/**
 * Default volatility estimates by asset category
 * Based on historical standard deviations
 */
declare const DEFAULT_VOLATILITY: Record<string, number>;
/**
 * Get volatility estimate for a category
 */
declare function getDefaultVolatility(category: string): number;
/**
 * Calculate portfolio-weighted volatility
 * Uses simple weighted average (ignores correlation for simplicity)
 */
declare function calculatePortfolioVolatility(allocations: {
    category: string;
    percent: number;
}[]): number;

export { ALLOCATION_PRESETS, type Allocation, type AssetCategory, type CategoryProjection, type CompoundingFrequency, type ConfidenceInterval, DEFAULT_ASSET_CATEGORIES, DEFAULT_VOLATILITY, type InvestmentMode, type MonteCarloParams, type MonteCarloResult, type NormalizationResult, type PortfolioProjection, type ProjectionParams, RISK_QUESTIONS, type RiskAssessment, type RiskProfile, type RiskQuestionnaireAnswer, type SimulationResult, type YearlyBreakdown, assessRisk, calculateAllocatedAmounts, calculateCAGR, calculateEffectiveAnnualRate, calculateEmergencyFund, calculateFIRENumber, calculateLumpsumFV, calculateLumpsumFVReal, calculateNominalRate, calculatePortfolioVolatility, calculateRealRate, calculateRiskScore, calculateSIPFV, calculateSIPFVReal, calculateSIPForGoal, calculateSIPTotalContributions, calculateYearsToDouble, calculateYearsToMultiplier, estimateYearsToFIRE, getCompoundingPeriods, getContributionsPerYear, getDefaultExpectedReturn, getDefaultVolatility, getRiskProfile, normalizeAllocations, projectPortfolio, runMonteCarloSimulation, validateAllocations };
