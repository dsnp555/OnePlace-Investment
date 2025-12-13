/**
 * Profile Routes
 * 
 * User profile management and risk assessment
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, getAuthClient } from '../middleware/auth.js';
import { assessRisk, calculateEmergencyFund, calculateFIRENumber, estimateYearsToFIRE } from '../../calc/dist/index.js';

interface ProfileUpdateBody {
    full_name?: string;
    dob?: string;
    income_monthly?: number;
    expenses_monthly?: number;
    existing_investments?: number;
    currency?: string;
}

interface RiskQuestionnaireBody {
    answers: Array<{
        questionId: string;
        score: number;
    }>;
}

export async function profileRoutes(fastify: FastifyInstance): Promise<void> {
    // All routes require authentication
    fastify.addHook('preHandler', authMiddleware);

    /**
     * GET /api/profile
     * Get current user's profile
     */
    fastify.get('/', {
        schema: {
            description: 'Get current user profile',
            tags: ['Profile'],
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        user_id: { type: 'string' },
                        full_name: { type: 'string', nullable: true },
                        dob: { type: 'string', nullable: true },
                        income_monthly: { type: 'number', nullable: true },
                        expenses_monthly: { type: 'number', nullable: true },
                        existing_investments: { type: 'number', nullable: true },
                        risk_profile: { type: 'string', nullable: true },
                        risk_score: { type: 'number', nullable: true },
                        currency: { type: 'string' },
                        created_at: { type: 'string' },
                        updated_at: { type: 'string' },
                    },
                },
            },
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const client = getAuthClient(request);

        const { data: profile, error } = await client
            .from('profiles')
            .select('*')
            .eq('user_id', request.userId)
            .single();

        if (error) {
            request.log.error(error, 'Failed to fetch profile');
            return reply.status(500).send({
                error: 'Database Error',
                message: 'Failed to fetch profile',
            });
        }

        return profile;
    });

    /**
     * PATCH /api/profile
     * Update current user's profile
     */
    fastify.patch('/', {
        schema: {
            description: 'Update user profile',
            tags: ['Profile'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                properties: {
                    full_name: { type: 'string' },
                    dob: { type: 'string', format: 'date' },
                    income_monthly: { type: 'number', minimum: 0 },
                    expenses_monthly: { type: 'number', minimum: 0 },
                    existing_investments: { type: 'number', minimum: 0 },
                    currency: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: ProfileUpdateBody }>, reply: FastifyReply) => {
        const client = getAuthClient(request);
        const updates = request.body;

        const { data: profile, error } = await client
            .from('profiles')
            .update(updates)
            .eq('user_id', request.userId)
            .select()
            .single();

        if (error) {
            request.log.error(error, 'Failed to update profile');
            return reply.status(500).send({
                error: 'Database Error',
                message: 'Failed to update profile',
            });
        }

        return profile;
    });

    /**
     * POST /api/profile/risk-assessment
     * Submit risk questionnaire and calculate risk profile
     */
    fastify.post('/risk-assessment', {
        schema: {
            description: 'Submit risk questionnaire answers',
            tags: ['Profile'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['answers'],
                properties: {
                    answers: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['questionId', 'score'],
                            properties: {
                                questionId: { type: 'string' },
                                score: { type: 'number', minimum: 1, maximum: 5 },
                            },
                        },
                    },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: RiskQuestionnaireBody }>, reply: FastifyReply) => {
        const client = getAuthClient(request);
        const { answers } = request.body;

        // Calculate risk assessment
        const assessment = assessRisk(answers);

        // Save questionnaire response
        await client.from('risk_questionnaire_responses').insert({
            user_id: request.userId,
            answers,
            calculated_score: assessment.score,
            calculated_profile: assessment.profile,
        });

        // Update profile with risk assessment
        const { data: profile, error } = await client
            .from('profiles')
            .update({
                risk_profile: assessment.profile,
                risk_score: assessment.score,
            })
            .eq('user_id', request.userId)
            .select()
            .single();

        if (error) {
            request.log.error(error, 'Failed to update risk profile');
            return reply.status(500).send({
                error: 'Database Error',
                message: 'Failed to update risk profile',
            });
        }

        return {
            ...assessment,
            profile: profile,
        };
    });

    /**
     * GET /api/profile/financial-health
     * Get financial health summary including emergency fund and FIRE estimates
     */
    fastify.get('/financial-health', {
        schema: {
            description: 'Get financial health summary',
            tags: ['Profile'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const client = getAuthClient(request);

        const { data: profile, error } = await client
            .from('profiles')
            .select('*')
            .eq('user_id', request.userId)
            .single();

        if (error || !profile) {
            return reply.status(404).send({
                error: 'Not Found',
                message: 'Profile not found',
            });
        }

        const monthlyExpenses = profile.expenses_monthly || 0;
        const monthlyIncome = profile.income_monthly || 0;
        const existingInvestments = profile.existing_investments || 0;
        const riskProfile = profile.risk_profile || 'balanced';

        // Calculate metrics
        const annualExpenses = monthlyExpenses * 12;
        const monthlySavings = monthlyIncome - monthlyExpenses;
        const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

        const emergencyFund = calculateEmergencyFund(monthlyExpenses, riskProfile as any);
        const fireNumber = calculateFIRENumber(annualExpenses);
        const yearsToFIRE = estimateYearsToFIRE(
            existingInvestments,
            monthlySavings,
            0.10, // Assumed 10% return
            fireNumber
        );

        return {
            summary: {
                monthlyIncome: monthlyIncome,
                monthlyExpenses: monthlyExpenses,
                monthlySavings: monthlySavings,
                savingsRate: Math.round(savingsRate * 100) / 100,
            },
            emergencyFund: {
                current: 0, // Would need separate tracking
                minimum: emergencyFund.minimum,
                recommended: emergencyFund.recommended,
                ideal: emergencyFund.ideal,
            },
            fire: {
                targetNumber: fireNumber,
                currentProgress: existingInvestments,
                progressPercent: Math.round((existingInvestments / fireNumber) * 10000) / 100,
                estimatedYears: yearsToFIRE,
            },
            riskProfile: {
                profile: riskProfile,
                score: profile.risk_score,
            },
        };
    });
}
