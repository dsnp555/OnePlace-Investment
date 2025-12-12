/**
 * AI Recommendations API Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase.js';
import {
    generateRecommendations,
    getInsightsSummary,
    type PortfolioAnalysis,
    type MarketCondition,
} from '../services/aiRecommendations.js';

export async function recommendationRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /api/recommendations
     * Get AI-powered investment recommendations
     */
    fastify.get('/', {
        schema: {
            description: 'Get personalized investment recommendations',
            tags: ['Recommendations'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).user?.id || 'demo-user';

        // Fetch user data for analysis
        let analysis: PortfolioAnalysis = {
            totalValue: 0,
            allocations: [],
        };

        try {
            // Get user's strategies and allocations
            const { data: strategies } = await supabase
                .from('strategies')
                .select('*, allocations(*)')
                .eq('user_id', userId);

            if (strategies && strategies.length > 0) {
                // Calculate total value
                let totalInvested = 0;
                let totalProjected = 0;
                const allAllocations: any[] = [];

                strategies.forEach((strategy: any) => {
                    const amount = strategy.amount || 0;
                    const duration = strategy.duration_years || 0;
                    const mode = strategy.mode || 'lumpsum';

                    if (mode === 'sip') {
                        totalInvested += amount * 12 * duration;
                    } else {
                        totalInvested += amount;
                    }

                    if (strategy.projected_value) {
                        totalProjected += strategy.projected_value;
                    } else {
                        const rate = 0.12;
                        if (mode === 'sip') {
                            totalProjected += amount * 12 * ((Math.pow(1 + rate, duration) - 1) / rate);
                        } else {
                            totalProjected += amount * Math.pow(1 + rate, duration);
                        }
                    }

                    if (strategy.allocations) {
                        allAllocations.push(...strategy.allocations);
                    }
                });

                analysis.totalValue = totalProjected;
                analysis.allocations = allAllocations;
            }

            // Get user's risk profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('risk_profile')
                .eq('id', userId)
                .single();

            if (profile?.risk_profile) {
                analysis.riskProfile = profile.risk_profile;
            }

            // Get FIRE progress
            const { data: fireGoal } = await supabase
                .from('fire_goals')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (fireGoal) {
                if (fireGoal.fire_number && fireGoal.current_savings) {
                    analysis.fireProgress = Math.min(100, (fireGoal.current_savings / fireGoal.fire_number) * 100);
                }
                analysis.yearsToFire = fireGoal.years_to_fire || 20;
            }
        } catch (error) {
            // Continue with empty analysis if fetch fails
            console.error('Error fetching user data for recommendations:', error);
        }

        // Mock market conditions (would come from Alpha Vantage in production)
        const marketConditions: MarketCondition = {
            sentiment: 'neutral',
            volatilityIndex: 15,
            indexChange: 8.5,
        };

        const recommendations = generateRecommendations(analysis, marketConditions);
        const summary = getInsightsSummary(recommendations);

        return {
            recommendations,
            summary,
            generatedAt: new Date().toISOString(),
        };
    });

    /**
     * GET /api/recommendations/summary
     * Get quick insights summary
     */
    fastify.get('/summary', {
        schema: {
            description: 'Get insights summary',
            tags: ['Recommendations'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).user?.id || 'demo-user';

        // Simplified version - just return counts
        const analysis: PortfolioAnalysis = {
            totalValue: 0,
            allocations: [],
        };

        const recommendations = generateRecommendations(analysis);
        const summary = getInsightsSummary(recommendations);

        return {
            ...summary,
            lastUpdated: new Date().toISOString(),
        };
    });

    /**
     * POST /api/recommendations/refresh
     * Force refresh recommendations
     */
    fastify.post('/refresh', {
        schema: {
            description: 'Refresh recommendations',
            tags: ['Recommendations'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // In a real implementation, this would trigger a background job
        // to recalculate recommendations based on latest data
        return {
            success: true,
            message: 'Recommendations refreshed',
            refreshedAt: new Date().toISOString(),
        };
    });
}
