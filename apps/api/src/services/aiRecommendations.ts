/**
 * AI Recommendation Service
 * 
 * Rule-based investment recommendations based on:
 * - Risk profile
 * - Portfolio allocation
 * - Market conditions
 * - Investment goals
 * - FIRE progress
 */

import { RiskProfile, Allocation } from '@oneplace/calc';

interface Recommendation {
    id: string;
    type: 'rebalance' | 'allocation' | 'goal' | 'risk' | 'opportunity' | 'warning';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action?: string;
    actionLink?: string;
    impact?: string;
    createdAt: Date;
}

interface PortfolioAnalysis {
    totalValue: number;
    allocations: Allocation[];
    riskProfile?: RiskProfile;
    fireProgress?: number;
    yearsToFire?: number;
}

interface MarketCondition {
    sentiment: 'bullish' | 'neutral' | 'bearish';
    volatilityIndex: number;
    indexChange: number; // Nifty 50 YTD change
}

// Ideal allocation by risk profile
const IDEAL_ALLOCATIONS: Record<RiskProfile, Record<string, number>> = {
    conservative: {
        'Fixed Deposits': 40,
        'Government Bonds': 30,
        'Gold': 15,
        'Large Cap Stocks': 10,
        'Cash': 5,
    },
    moderate: {
        'Large Cap Stocks': 30,
        'Mutual Funds': 25,
        'Fixed Deposits': 20,
        'Gold': 15,
        'International': 10,
    },
    aggressive: {
        'Small Cap Stocks': 25,
        'Large Cap Stocks': 25,
        'Mutual Funds': 20,
        'Crypto': 15,
        'International': 15,
    },
    'very-aggressive': {
        'Small Cap Stocks': 35,
        'Crypto': 25,
        'Large Cap Stocks': 20,
        'International': 15,
        'Mutual Funds': 5,
    },
};

function generateId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Analyze portfolio and generate allocation recommendations
 */
function analyzeAllocation(
    allocations: Allocation[],
    riskProfile: RiskProfile
): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const ideal = IDEAL_ALLOCATIONS[riskProfile];

    // Calculate current allocation percentages
    const totalPercent = allocations.reduce((sum, a) => sum + a.percentage, 0);

    // Check for over-concentration
    allocations.forEach(alloc => {
        if (alloc.percentage > 50) {
            recommendations.push({
                id: generateId(),
                type: 'warning',
                priority: 'high',
                title: 'Over-Concentration Risk',
                description: `${alloc.categoryName} makes up ${alloc.percentage.toFixed(1)}% of your portfolio. Consider diversifying to reduce risk.`,
                action: 'Rebalance Portfolio',
                actionLink: '/dashboard/portfolio',
                impact: 'Reduces single-asset risk by 30-40%',
                createdAt: new Date(),
            });
        }
    });

    // Check for missing asset classes based on risk profile
    const currentCategories = allocations.map(a => a.categoryName.toLowerCase());

    if (riskProfile === 'conservative' || riskProfile === 'moderate') {
        if (!currentCategories.some(c => c.includes('gold') || c.includes('bond'))) {
            recommendations.push({
                id: generateId(),
                type: 'allocation',
                priority: 'medium',
                title: 'Add Defensive Assets',
                description: 'Consider adding Gold or Bonds to your portfolio for stability during market downturns.',
                action: 'Add to Portfolio',
                actionLink: '/dashboard/strategies/new',
                impact: 'Reduces portfolio volatility by 15-20%',
                createdAt: new Date(),
            });
        }
    }

    if (riskProfile === 'aggressive' || riskProfile === 'very-aggressive') {
        if (!currentCategories.some(c => c.includes('international') || c.includes('global'))) {
            recommendations.push({
                id: generateId(),
                type: 'opportunity',
                priority: 'medium',
                title: 'Geographic Diversification',
                description: 'Consider adding international exposure (US/Global funds) to benefit from global growth.',
                action: 'Explore Options',
                actionLink: '/dashboard/strategies/new',
                impact: 'Access to 60% of global market cap',
                createdAt: new Date(),
            });
        }
    }

    return recommendations;
}

/**
 * Generate FIRE-related recommendations
 */
function analyzeFireProgress(
    fireProgress: number,
    yearsToFire: number,
    currentAge: number = 30
): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (fireProgress < 10) {
        recommendations.push({
            id: generateId(),
            type: 'goal',
            priority: 'high',
            title: 'Boost Your Savings Rate',
            description: 'Your FIRE progress is early stage. Consider increasing your monthly SIP by 10-20% to accelerate your journey.',
            action: 'Update Strategy',
            actionLink: '/dashboard/fire',
            impact: 'Reduces time to FIRE by 2-5 years',
            createdAt: new Date(),
        });
    } else if (fireProgress >= 50 && fireProgress < 75) {
        recommendations.push({
            id: generateId(),
            type: 'goal',
            priority: 'medium',
            title: 'Halfway to FIRE! 🎉',
            description: 'Great progress! Consider gradually shifting to more conservative investments to protect your gains.',
            action: 'Review Allocation',
            actionLink: '/dashboard/portfolio',
            impact: 'Protects accumulated wealth',
            createdAt: new Date(),
        });
    } else if (fireProgress >= 75) {
        recommendations.push({
            id: generateId(),
            type: 'goal',
            priority: 'high',
            title: 'FIRE is Near!',
            description: `You're ${fireProgress}% there! Start planning your withdrawal strategy and ensure 2-3 years of expenses in liquid assets.`,
            action: 'Plan Withdrawal',
            actionLink: '/dashboard/fire',
            impact: 'Ensures smooth transition to retirement',
            createdAt: new Date(),
        });
    }

    if (yearsToFire > 20 && currentAge < 35) {
        recommendations.push({
            id: generateId(),
            type: 'opportunity',
            priority: 'low',
            title: 'Time is Your Ally',
            description: 'With 20+ years to FIRE, you can afford higher equity allocation. Consider increasing stock exposure.',
            action: 'Increase Equity',
            actionLink: '/dashboard/strategies/new',
            impact: 'Historically 4-6% higher returns over 20 years',
            createdAt: new Date(),
        });
    }

    return recommendations;
}

/**
 * Generate market-based recommendations
 */
function analyzeMarketConditions(
    conditions: MarketCondition,
    riskProfile: RiskProfile
): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (conditions.sentiment === 'bearish' && conditions.indexChange < -10) {
        recommendations.push({
            id: generateId(),
            type: 'opportunity',
            priority: 'medium',
            title: 'Market Correction Opportunity',
            description: 'Markets are down. This could be a good time to invest more if you have surplus funds and a long-term horizon.',
            action: 'Consider Investing',
            actionLink: '/dashboard/strategies/new',
            impact: 'Buy low, potentially higher future returns',
            createdAt: new Date(),
        });

        if (riskProfile === 'conservative') {
            recommendations.push({
                id: generateId(),
                type: 'warning',
                priority: 'low',
                title: 'Stay Calm During Volatility',
                description: 'Market corrections are normal. With your conservative profile, your portfolio should be well-protected. Avoid panic selling.',
                createdAt: new Date(),
            });
        }
    }

    if (conditions.volatilityIndex > 25) {
        recommendations.push({
            id: generateId(),
            type: 'warning',
            priority: 'medium',
            title: 'High Market Volatility',
            description: 'VIX is elevated. Consider holding off on large lump-sum investments and use SIP to average your entry.',
            action: 'Use SIP Strategy',
            actionLink: '/dashboard/strategies/new',
            impact: 'Reduces timing risk',
            createdAt: new Date(),
        });
    }

    if (conditions.sentiment === 'bullish' && conditions.indexChange > 20) {
        recommendations.push({
            id: generateId(),
            type: 'rebalance',
            priority: 'medium',
            title: 'Consider Booking Profits',
            description: 'Markets have rallied significantly. Consider rebalancing by booking some profits in overweight positions.',
            action: 'Rebalance Now',
            actionLink: '/dashboard/portfolio',
            impact: 'Locks in gains, reduces risk',
            createdAt: new Date(),
        });
    }

    return recommendations;
}

/**
 * Generate all recommendations for a user
 */
export function generateRecommendations(
    analysis: PortfolioAnalysis,
    marketConditions?: MarketCondition
): Recommendation[] {
    let recommendations: Recommendation[] = [];

    // Allocation recommendations
    if (analysis.allocations.length > 0 && analysis.riskProfile) {
        recommendations = recommendations.concat(
            analyzeAllocation(analysis.allocations, analysis.riskProfile)
        );
    }

    // FIRE recommendations
    if (analysis.fireProgress !== undefined && analysis.yearsToFire !== undefined) {
        recommendations = recommendations.concat(
            analyzeFireProgress(analysis.fireProgress, analysis.yearsToFire)
        );
    }

    // Market-based recommendations
    if (marketConditions && analysis.riskProfile) {
        recommendations = recommendations.concat(
            analyzeMarketConditions(marketConditions, analysis.riskProfile)
        );
    }

    // Default recommendations if none generated
    if (recommendations.length === 0) {
        recommendations.push({
            id: generateId(),
            type: 'goal',
            priority: 'low',
            title: 'Start Your Investment Journey',
            description: 'Create your first investment strategy to receive personalized recommendations.',
            action: 'Create Strategy',
            actionLink: '/dashboard/strategies/new',
            createdAt: new Date(),
        });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
}

/**
 * Get quick insights summary
 */
export function getInsightsSummary(recommendations: Recommendation[]): {
    total: number;
    highPriority: number;
    opportunities: number;
    warnings: number;
} {
    return {
        total: recommendations.length,
        highPriority: recommendations.filter(r => r.priority === 'high').length,
        opportunities: recommendations.filter(r => r.type === 'opportunity').length,
        warnings: recommendations.filter(r => r.type === 'warning').length,
    };
}

export type { Recommendation, PortfolioAnalysis, MarketCondition };
