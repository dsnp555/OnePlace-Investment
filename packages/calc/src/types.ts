/**
 * Investment calculation types and interfaces
 */

/** Investment mode types */
export type InvestmentMode = 'lumpsum' | 'sip' | 'goal' | 'withdrawal';

/** Compounding frequency */
export type CompoundingFrequency = 'daily' | 'monthly' | 'quarterly' | 'annually';

/** Risk profile types */
export type RiskProfile = 'conservative' | 'balanced' | 'aggressive';

/** Asset category */
export interface AssetCategory {
    id: string;
    name: string;
    defaultExpectedReturn: number; // Annual return as decimal (e.g., 0.12 for 12%)
    riskLevel: 'low' | 'medium' | 'high';
}

/** Allocation for a single category */
export interface Allocation {
    category: string;
    percent: number; // User input percentage (may not sum to 100)
    percentNormalized?: number; // Normalized to sum to 100
    amount?: number; // Allocated amount in currency
    expectedAnnualReturn: number; // Decimal (e.g., 0.12)
}

/** Projection parameters */
export interface ProjectionParams {
    mode: InvestmentMode;
    amount: number; // Total investment amount or monthly SIP amount
    durationYears: number;
    compounding: CompoundingFrequency;
    allocations: Allocation[];
    normalize: boolean; // If true, normalize allocations to 100%
    inflationRate?: number; // Optional, decimal (e.g., 0.05)
    taxPercent?: number; // Optional, tax on returns (e.g., 0.1 for 10%)
}

/** Per-category projection result */
export interface CategoryProjection {
    category: string;
    percentNormalized: number;
    amount: number;
    projectedFV: number;
    totalContributions: number;
    totalReturns: number;
    cagr: number;
    realFV?: number; // Inflation-adjusted
}

/** Yearly breakdown entry */
export interface YearlyBreakdown {
    year: number;
    startBalance: number;
    contributions: number;
    interest: number;
    endBalance: number;
    inflationAdjusted?: number;
}

/** Full portfolio projection result */
export interface PortfolioProjection {
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
export interface NormalizationResult {
    success: boolean;
    allocations: Allocation[];
    totalPercent: number;
    error?: string;
}

/** Risk questionnaire answer */
export interface RiskQuestionnaireAnswer {
    questionId: string;
    score: number; // 1-5 scale
}

/** Risk assessment result */
export interface RiskAssessment {
    profile: RiskProfile;
    score: number; // 0-100
    suggestedAllocations: Allocation[];
}
