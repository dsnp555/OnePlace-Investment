/**
 * OnePlace Invest Calculation Library
 * 
 * Shared TypeScript calculation functions for investment projections,
 * portfolio management, and financial planning.
 */

// Types
export * from './types';

// Lump-sum calculations
export {
    calculateLumpsumFV,
    calculateLumpsumFVReal,
    getCompoundingPeriods,
} from './lumpsum';

// SIP calculations
export {
    calculateSIPFV,
    calculateSIPFVReal,
    calculateSIPTotalContributions,
    calculateSIPForGoal,
    getContributionsPerYear,
} from './sip';

// CAGR and rate calculations
export {
    calculateCAGR,
    calculateRealRate,
    calculateNominalRate,
    calculateEffectiveAnnualRate,
    calculateYearsToDouble,
    calculateYearsToMultiplier,
} from './cagr';

// Portfolio functions
export {
    validateAllocations,
    normalizeAllocations,
    calculateAllocatedAmounts,
    projectPortfolio,
} from './portfolio';

// Risk assessment
export {
    DEFAULT_ASSET_CATEGORIES,
    ALLOCATION_PRESETS,
    RISK_QUESTIONS,
    getDefaultExpectedReturn,
    calculateRiskScore,
    getRiskProfile,
    assessRisk,
    calculateEmergencyFund,
    calculateFIRENumber,
    estimateYearsToFIRE,
} from './risk';

// Monte Carlo simulation
export {
    runMonteCarloSimulation,
    getDefaultVolatility,
    calculatePortfolioVolatility,
    DEFAULT_VOLATILITY,
} from './monteCarlo';

export type {
    MonteCarloParams,
    MonteCarloResult,
    SimulationResult,
    ConfidenceInterval,
} from './monteCarlo';

