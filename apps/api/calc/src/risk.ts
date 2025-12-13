/**
 * Risk Assessment and Default Allocations
 * 
 * Provides:
 * - Risk questionnaire scoring
 * - Risk profile determination
 * - Default allocation presets by risk profile
 * - Default expected returns by asset category
 */

import { Allocation, RiskProfile, RiskAssessment, RiskQuestionnaireAnswer, AssetCategory } from './types';

/**
 * Default asset categories with expected returns and risk levels
 * Returns are historical averages adjusted for Indian market context
 */
export const DEFAULT_ASSET_CATEGORIES: AssetCategory[] = [
    { id: 'stocks', name: 'Stocks', defaultExpectedReturn: 0.12, riskLevel: 'high' },
    { id: 'mutual_funds', name: 'Mutual Funds', defaultExpectedReturn: 0.10, riskLevel: 'medium' },
    { id: 'etfs', name: 'ETFs', defaultExpectedReturn: 0.09, riskLevel: 'medium' },
    { id: 'index_funds', name: 'Index Funds', defaultExpectedReturn: 0.10, riskLevel: 'medium' },
    { id: 'reits', name: 'REITs', defaultExpectedReturn: 0.08, riskLevel: 'medium' },
    { id: 'gold', name: 'Gold', defaultExpectedReturn: 0.07, riskLevel: 'low' },
    { id: 'silver', name: 'Silver', defaultExpectedReturn: 0.06, riskLevel: 'medium' },
    { id: 'bonds', name: 'Bonds', defaultExpectedReturn: 0.07, riskLevel: 'low' },
    { id: 'fixed_deposits', name: 'Fixed Deposits', defaultExpectedReturn: 0.065, riskLevel: 'low' },
    { id: 'cash', name: 'Cash / Savings', defaultExpectedReturn: 0.04, riskLevel: 'low' },
    { id: 'crypto', name: 'Crypto', defaultExpectedReturn: 0.15, riskLevel: 'high' },
    { id: 'real_estate', name: 'Real Estate', defaultExpectedReturn: 0.09, riskLevel: 'medium' },
    { id: 'p2p', name: 'P2P Lending', defaultExpectedReturn: 0.11, riskLevel: 'high' },
    { id: 'ppf', name: 'PPF', defaultExpectedReturn: 0.071, riskLevel: 'low' },
    { id: 'nps', name: 'NPS', defaultExpectedReturn: 0.09, riskLevel: 'medium' },
];

/**
 * Get default expected return for a category
 */
export function getDefaultExpectedReturn(category: string): number {
    const found = DEFAULT_ASSET_CATEGORIES.find(
        (c) => c.id === category.toLowerCase() || c.name.toLowerCase() === category.toLowerCase()
    );
    return found?.defaultExpectedReturn ?? 0.08; // Default 8%
}

/**
 * Default allocation presets by risk profile
 */
export const ALLOCATION_PRESETS: Record<RiskProfile, Allocation[]> = {
    conservative: [
        { category: 'Fixed Deposits', percent: 30, expectedAnnualReturn: 0.065 },
        { category: 'Bonds', percent: 25, expectedAnnualReturn: 0.07 },
        { category: 'Gold', percent: 15, expectedAnnualReturn: 0.07 },
        { category: 'Mutual Funds', percent: 15, expectedAnnualReturn: 0.09 },
        { category: 'PPF', percent: 10, expectedAnnualReturn: 0.071 },
        { category: 'Cash / Savings', percent: 5, expectedAnnualReturn: 0.04 },
    ],
    balanced: [
        { category: 'Mutual Funds', percent: 30, expectedAnnualReturn: 0.10 },
        { category: 'Stocks', percent: 25, expectedAnnualReturn: 0.12 },
        { category: 'Index Funds', percent: 15, expectedAnnualReturn: 0.10 },
        { category: 'Bonds', percent: 10, expectedAnnualReturn: 0.07 },
        { category: 'Gold', percent: 10, expectedAnnualReturn: 0.07 },
        { category: 'REITs', percent: 10, expectedAnnualReturn: 0.08 },
    ],
    aggressive: [
        { category: 'Stocks', percent: 40, expectedAnnualReturn: 0.12 },
        { category: 'Mutual Funds', percent: 25, expectedAnnualReturn: 0.11 },
        { category: 'ETFs', percent: 15, expectedAnnualReturn: 0.10 },
        { category: 'Crypto', percent: 10, expectedAnnualReturn: 0.15 },
        { category: 'P2P Lending', percent: 5, expectedAnnualReturn: 0.11 },
        { category: 'REITs', percent: 5, expectedAnnualReturn: 0.08 },
    ],
};

/**
 * Risk questionnaire questions with weights
 */
export const RISK_QUESTIONS = [
    {
        id: 'age_group',
        question: 'What is your age group?',
        options: [
            { value: 5, label: '18-30' },
            { value: 4, label: '31-40' },
            { value: 3, label: '41-50' },
            { value: 2, label: '51-60' },
            { value: 1, label: '60+' },
        ],
        weight: 1.5,
    },
    {
        id: 'investment_horizon',
        question: 'What is your investment time horizon?',
        options: [
            { value: 5, label: '10+ years' },
            { value: 4, label: '5-10 years' },
            { value: 3, label: '3-5 years' },
            { value: 2, label: '1-3 years' },
            { value: 1, label: 'Less than 1 year' },
        ],
        weight: 2,
    },
    {
        id: 'loss_reaction',
        question: 'If your investments dropped 20% in value, you would:',
        options: [
            { value: 5, label: 'Buy more at lower prices' },
            { value: 4, label: 'Hold and wait for recovery' },
            { value: 3, label: 'Wait and see, might sell if it drops more' },
            { value: 2, label: 'Sell some to limit losses' },
            { value: 1, label: 'Sell everything immediately' },
        ],
        weight: 2,
    },
    {
        id: 'income_stability',
        question: 'How stable is your income?',
        options: [
            { value: 5, label: 'Very stable (government job, established business)' },
            { value: 4, label: 'Stable (salaried with good job security)' },
            { value: 3, label: 'Moderately stable (private sector)' },
            { value: 2, label: 'Variable (freelance, commissions)' },
            { value: 1, label: 'Unstable or currently unemployed' },
        ],
        weight: 1.5,
    },
    {
        id: 'emergency_fund',
        question: 'Do you have an emergency fund covering 6+ months of expenses?',
        options: [
            { value: 5, label: 'Yes, more than 12 months' },
            { value: 4, label: 'Yes, 6-12 months' },
            { value: 3, label: 'Yes, 3-6 months' },
            { value: 2, label: 'Less than 3 months' },
            { value: 1, label: 'No emergency fund' },
        ],
        weight: 1.5,
    },
    {
        id: 'investment_knowledge',
        question: 'How would you rate your investment knowledge?',
        options: [
            { value: 5, label: 'Expert - I actively manage investments' },
            { value: 4, label: 'Advanced - I understand most concepts' },
            { value: 3, label: 'Intermediate - I know basics' },
            { value: 2, label: 'Basic - Just starting to learn' },
            { value: 1, label: 'Beginner - No experience' },
        ],
        weight: 1,
    },
    {
        id: 'risk_return_preference',
        question: 'Which statement best describes your preference?',
        options: [
            { value: 5, label: 'Maximum growth, I can handle high volatility' },
            { value: 4, label: 'High growth with some volatility tolerance' },
            { value: 3, label: 'Balanced growth with moderate risk' },
            { value: 2, label: 'Steady growth with low risk' },
            { value: 1, label: 'Capital preservation is most important' },
        ],
        weight: 2,
    },
    {
        id: 'financial_goals',
        question: 'What is your primary financial goal?',
        options: [
            { value: 5, label: 'Wealth accumulation / FIRE' },
            { value: 4, label: 'Retirement planning (10+ years away)' },
            { value: 3, label: 'Major purchase (home, education)' },
            { value: 2, label: 'Short-term savings goal' },
            { value: 1, label: 'Emergency fund building' },
        ],
        weight: 1.5,
    },
];

/**
 * Calculate risk score from questionnaire answers
 * 
 * @param answers - Array of question answers with scores
 * @returns Risk score from 0-100
 */
export function calculateRiskScore(answers: RiskQuestionnaireAnswer[]): number {
    if (!answers || answers.length === 0) {
        return 50; // Default to middle
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;

    answers.forEach((answer) => {
        const question = RISK_QUESTIONS.find((q) => q.id === answer.questionId);
        if (question) {
            totalWeightedScore += answer.score * question.weight;
            totalWeight += question.weight * 5; // Max score per question is 5
        }
    });

    if (totalWeight === 0) {
        return 50;
    }

    // Normalize to 0-100 scale
    const score = (totalWeightedScore / totalWeight) * 100;
    return Math.round(score);
}

/**
 * Determine risk profile from score
 * 
 * @param score - Risk score from 0-100
 * @returns Risk profile
 */
export function getRiskProfile(score: number): RiskProfile {
    if (score >= 70) {
        return 'aggressive';
    } else if (score >= 40) {
        return 'balanced';
    } else {
        return 'conservative';
    }
}

/**
 * Get complete risk assessment from questionnaire answers
 * 
 * @param answers - Array of question answers
 * @returns Complete risk assessment with profile and suggested allocations
 */
export function assessRisk(answers: RiskQuestionnaireAnswer[]): RiskAssessment {
    const score = calculateRiskScore(answers);
    const profile = getRiskProfile(score);
    const suggestedAllocations = ALLOCATION_PRESETS[profile];

    return {
        profile,
        score,
        suggestedAllocations: suggestedAllocations.map((a) => ({
            ...a,
            percentNormalized: a.percent,
        })),
    };
}

/**
 * Calculate emergency fund recommendation
 * 
 * @param monthlyExpenses - Monthly expenses amount
 * @param riskProfile - User's risk profile
 * @returns Recommended emergency fund amount
 */
export function calculateEmergencyFund(
    monthlyExpenses: number,
    riskProfile: RiskProfile
): { minimum: number; recommended: number; ideal: number } {
    const multipliers: Record<RiskProfile, { min: number; rec: number; ideal: number }> = {
        conservative: { min: 6, rec: 9, ideal: 12 },
        balanced: { min: 6, rec: 8, ideal: 10 },
        aggressive: { min: 3, rec: 6, ideal: 8 },
    };

    const m = multipliers[riskProfile];

    return {
        minimum: monthlyExpenses * m.min,
        recommended: monthlyExpenses * m.rec,
        ideal: monthlyExpenses * m.ideal,
    };
}

/**
 * Calculate FIRE number (Financial Independence Retire Early target)
 * 
 * @param annualExpenses - Expected annual expenses in retirement
 * @param withdrawalRate - Safe withdrawal rate (default 4%)
 * @returns FIRE target amount
 */
export function calculateFIRENumber(
    annualExpenses: number,
    withdrawalRate: number = 0.04
): number {
    if (withdrawalRate <= 0) {
        return Infinity;
    }
    return Math.round(annualExpenses / withdrawalRate);
}

/**
 * Estimate years to FIRE
 * 
 * @param currentSavings - Current investment portfolio value
 * @param monthlyContribution - Monthly savings/investment amount
 * @param expectedReturn - Expected annual return (decimal)
 * @param fireNumber - Target FIRE number
 * @returns Estimated years to reach FIRE
 */
export function estimateYearsToFIRE(
    currentSavings: number,
    monthlyContribution: number,
    expectedReturn: number,
    fireNumber: number
): number {
    if (currentSavings >= fireNumber) {
        return 0;
    }

    if (monthlyContribution <= 0 && expectedReturn <= 0) {
        return Infinity;
    }

    // Binary search for years
    let low = 0;
    let high = 100;

    while (high - low > 0.1) {
        const mid = (low + high) / 2;

        // Calculate FV at mid years
        const lumpsumFV = currentSavings * Math.pow(1 + expectedReturn, mid);
        const sipFV = monthlyContribution > 0
            ? monthlyContribution * ((Math.pow(1 + expectedReturn / 12, mid * 12) - 1) / (expectedReturn / 12))
            : 0;
        const totalFV = lumpsumFV + sipFV;

        if (totalFV >= fireNumber) {
            high = mid;
        } else {
            low = mid;
        }
    }

    return Math.round(high * 10) / 10;
}
