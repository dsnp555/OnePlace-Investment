/**
 * Portfolio Allocation and Projection Functions
 * 
 * Handles:
 * - Normalization of allocations to sum to 100%
 * - Per-category projections
 * - Aggregate portfolio projections
 * - Yearly breakdowns
 */

import {
    Allocation,
    ProjectionParams,
    PortfolioProjection,
    CategoryProjection,
    YearlyBreakdown,
    NormalizationResult,
} from './types';
import { calculateLumpsumFV, calculateLumpsumFVReal, getCompoundingPeriods } from './lumpsum';
import { calculateSIPFV, calculateSIPFVReal, calculateSIPTotalContributions } from './sip';
import { calculateCAGR, calculateRealRate } from './cagr';

/**
 * Validate allocations for errors
 */
export function validateAllocations(allocations: Allocation[]): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!allocations || allocations.length === 0) {
        errors.push('At least one allocation is required');
    }

    allocations.forEach((alloc, index) => {
        if (!alloc.category || alloc.category.trim() === '') {
            errors.push(`Allocation ${index + 1}: Category name is required`);
        }
        if (alloc.percent < 0) {
            errors.push(`Allocation ${index + 1}: Percentage cannot be negative`);
        }
        if (alloc.percent > 100) {
            errors.push(`Allocation ${index + 1}: Single allocation cannot exceed 100%`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Normalize allocations to sum to 100%
 * 
 * @param allocations - Array of allocations with user-input percentages
 * @param strict - If true, return error when sum != 100; if false, auto-normalize
 * @returns Normalized allocations
 */
export function normalizeAllocations(
    allocations: Allocation[],
    strict: boolean = false
): NormalizationResult {
    if (!allocations || allocations.length === 0) {
        return {
            success: false,
            allocations: [],
            totalPercent: 0,
            error: 'No allocations provided',
        };
    }

    const totalPercent = allocations.reduce((sum, a) => sum + a.percent, 0);

    // Strict mode: must sum to exactly 100
    if (strict) {
        if (Math.abs(totalPercent - 100) > 0.01) {
            return {
                success: false,
                allocations,
                totalPercent,
                error: `Allocations must sum to 100%. Current total: ${totalPercent.toFixed(2)}%`,
            };
        }

        // Already sums to 100, just copy percentages
        const normalized = allocations.map((a) => ({
            ...a,
            percentNormalized: a.percent,
        }));

        return {
            success: true,
            allocations: normalized,
            totalPercent: 100,
        };
    }

    // Auto-normalize mode
    if (totalPercent === 0) {
        return {
            success: false,
            allocations,
            totalPercent: 0,
            error: 'Total allocation percentage is 0%',
        };
    }

    const normalized = allocations.map((a) => ({
        ...a,
        percentNormalized: Math.round((a.percent / totalPercent) * 100 * 100) / 100,
    }));

    return {
        success: true,
        allocations: normalized,
        totalPercent: 100,
    };
}

/**
 * Calculate allocated amounts for each category
 */
export function calculateAllocatedAmounts(
    totalAmount: number,
    allocations: Allocation[]
): Allocation[] {
    return allocations.map((a) => ({
        ...a,
        amount: Math.round((totalAmount * (a.percentNormalized ?? a.percent) / 100) * 100) / 100,
    }));
}

/**
 * Generate yearly breakdown for a single allocation
 */
function generateYearlyBreakdown(
    principal: number,
    annualRate: number,
    years: number,
    mode: 'lumpsum' | 'sip',
    monthlyContribution: number = 0,
    inflationRate?: number
): YearlyBreakdown[] {
    const breakdown: YearlyBreakdown[] = [];
    let currentBalance = mode === 'lumpsum' ? principal : 0;
    const monthlyRate = annualRate / 12;

    for (let year = 1; year <= years; year++) {
        const startBalance = currentBalance;
        let yearlyContributions = 0;
        let yearlyInterest = 0;

        // Simulate month by month for accuracy
        for (let month = 1; month <= 12; month++) {
            if (mode === 'sip') {
                currentBalance += monthlyContribution;
                yearlyContributions += monthlyContribution;
            }
            const monthInterest = currentBalance * monthlyRate;
            yearlyInterest += monthInterest;
            currentBalance += monthInterest;
        }

        const endBalance = Math.round(currentBalance * 100) / 100;
        let inflationAdjusted: number | undefined;

        if (inflationRate !== undefined) {
            const inflationFactor = Math.pow(1 + inflationRate, year);
            inflationAdjusted = Math.round((endBalance / inflationFactor) * 100) / 100;
        }

        breakdown.push({
            year,
            startBalance: Math.round(startBalance * 100) / 100,
            contributions: Math.round(yearlyContributions * 100) / 100,
            interest: Math.round(yearlyInterest * 100) / 100,
            endBalance,
            inflationAdjusted,
        });
    }

    return breakdown;
}

/**
 * Project portfolio future value across all categories
 * 
 * @param params - Projection parameters
 * @returns Complete portfolio projection with per-category and aggregate results
 */
export function projectPortfolio(params: ProjectionParams): PortfolioProjection {
    const {
        mode,
        amount,
        durationYears,
        compounding,
        allocations,
        normalize,
        inflationRate,
        taxPercent,
    } = params;

    // Step 1: Normalize allocations
    const normResult = normalizeAllocations(allocations, !normalize);
    if (!normResult.success) {
        throw new Error(normResult.error || 'Failed to normalize allocations');
    }

    // Step 2: Calculate allocated amounts
    const allocatedAmounts = calculateAllocatedAmounts(amount, normResult.allocations);

    // Step 3: Calculate per-category projections
    const categoryProjections: CategoryProjection[] = allocatedAmounts.map((alloc) => {
        const allocAmount = alloc.amount ?? 0;
        const rate = alloc.expectedAnnualReturn;

        let projectedFV: number;
        let totalContributions: number;

        if (mode === 'lumpsum' || mode === 'goal') {
            projectedFV = calculateLumpsumFV(allocAmount, rate, durationYears, compounding);
            totalContributions = allocAmount;
        } else if (mode === 'sip') {
            projectedFV = calculateSIPFV(allocAmount, rate, durationYears, 'monthly');
            totalContributions = calculateSIPTotalContributions(allocAmount, durationYears, 'monthly');
        } else {
            // Withdrawal mode - calculate how long funds last
            projectedFV = calculateLumpsumFV(allocAmount, rate, durationYears, compounding);
            totalContributions = allocAmount;
        }

        // Apply tax if specified
        const returns = projectedFV - totalContributions;
        if (taxPercent && returns > 0) {
            const taxAmount = returns * taxPercent;
            projectedFV = projectedFV - taxAmount;
        }

        const cagr = calculateCAGR(totalContributions, projectedFV, durationYears);

        let realFV: number | undefined;
        if (inflationRate !== undefined) {
            const inflationFactor = Math.pow(1 + inflationRate, durationYears);
            realFV = Math.round((projectedFV / inflationFactor) * 100) / 100;
        }

        return {
            category: alloc.category,
            percentNormalized: alloc.percentNormalized ?? alloc.percent,
            amount: allocAmount,
            projectedFV: Math.round(projectedFV * 100) / 100,
            totalContributions: Math.round(totalContributions * 100) / 100,
            totalReturns: Math.round((projectedFV - totalContributions) * 100) / 100,
            cagr,
            realFV,
        };
    });

    // Step 4: Calculate aggregate metrics
    const aggregateFV = categoryProjections.reduce((sum, c) => sum + c.projectedFV, 0);
    const aggregateContributions = categoryProjections.reduce((sum, c) => sum + c.totalContributions, 0);
    const aggregateReturns = aggregateFV - aggregateContributions;
    const aggregateCAGR = calculateCAGR(aggregateContributions, aggregateFV, durationYears);

    let realAggregateFV: number | undefined;
    if (inflationRate !== undefined) {
        realAggregateFV = categoryProjections.reduce((sum, c) => sum + (c.realFV ?? 0), 0);
    }

    // Step 5: Generate yearly breakdown (weighted average)
    const yearlyBreakdown: YearlyBreakdown[] = [];

    // Calculate weighted average return
    const weightedRate = allocatedAmounts.reduce(
        (sum, a) => sum + (a.expectedAnnualReturn * (a.percentNormalized ?? a.percent) / 100),
        0
    );

    // Generate breakdown based on mode
    if (mode === 'lumpsum' || mode === 'goal') {
        const breakdown = generateYearlyBreakdown(
            amount,
            weightedRate,
            durationYears,
            'lumpsum',
            0,
            inflationRate
        );
        yearlyBreakdown.push(...breakdown);
    } else if (mode === 'sip') {
        const breakdown = generateYearlyBreakdown(
            0,
            weightedRate,
            durationYears,
            'sip',
            amount,
            inflationRate
        );
        yearlyBreakdown.push(...breakdown);
    }

    return {
        normalizedAllocations: categoryProjections,
        aggregate: {
            futureValue: Math.round(aggregateFV * 100) / 100,
            totalContributions: Math.round(aggregateContributions * 100) / 100,
            totalReturns: Math.round(aggregateReturns * 100) / 100,
            cagr: aggregateCAGR,
            realFutureValue: realAggregateFV ? Math.round(realAggregateFV * 100) / 100 : undefined,
        },
        yearlyBreakdown,
    };
}
