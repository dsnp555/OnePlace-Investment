/**
 * Strategy Routes
 * 
 * CRUD operations for investment strategies and projections
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, getAuthClient, optionalAuthMiddleware } from '../middleware/auth.js';
import {
    projectPortfolio,
    normalizeAllocations,
    Allocation as CalcAllocation,
    ProjectionParams,
} from '../../calc/dist/index.js';

interface CreateStrategyBody {
    name: string;
    description?: string;
    mode: 'lumpsum' | 'sip' | 'goal' | 'withdrawal';
    amount: number;
    currency?: string;
    duration_years: number;
    compounding?: 'daily' | 'monthly' | 'quarterly' | 'annually';
    normalize_mode?: boolean;
    inflation_rate?: number;
    tags?: string[];
    allocations: Array<{
        category: string;
        percent: number;
        expected_annual_return: number;
    }>;
}

interface ProjectStrategyBody {
    mode?: 'lumpsum' | 'sip' | 'goal' | 'withdrawal';
    amount?: number;
    duration_years?: number;
    compounding?: 'daily' | 'monthly' | 'quarterly' | 'annually';
    normalize?: boolean;
    inflation_rate?: number;
    allocations?: Array<{
        category: string;
        percent: number;
        expected_annual_return: number;
    }>;
}

export async function strategyRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /api/strategy
     * List user's strategies
     */
    fastify.get('/', {
        schema: {
            description: 'List user strategies',
            tags: ['Strategy'],
            security: [{ bearerAuth: [] }],
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                    offset: { type: 'integer', minimum: 0, default: 0 },
                },
            },
        },
        preHandler: [authMiddleware],
    }, async (request: FastifyRequest<{ Querystring: { limit?: number; offset?: number } }>, reply: FastifyReply) => {
        const client = getAuthClient(request);
        const { limit = 20, offset = 0 } = request.query;

        const { data: strategies, error, count } = await client
            .from('strategies')
            .select('*, allocations(*)', { count: 'exact' })
            .eq('user_id', request.userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            request.log.error(error, 'Failed to fetch strategies');
            return reply.status(500).send({
                error: 'Database Error',
                message: 'Failed to fetch strategies',
            });
        }

        return {
            strategies,
            total: count,
            limit,
            offset,
        };
    });

    /**
     * GET /api/strategy/:id
     * Get a specific strategy with allocations
     */
    fastify.get('/:id', {
        schema: {
            description: 'Get strategy by ID',
            tags: ['Strategy'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                },
            },
        },
        preHandler: [authMiddleware],
    }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const client = getAuthClient(request);
        const { id } = request.params;

        const { data: strategy, error } = await client
            .from('strategies')
            .select('*, allocations(*), projections(*)')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return reply.status(404).send({
                    error: 'Not Found',
                    message: 'Strategy not found',
                });
            }
            request.log.error(error, 'Failed to fetch strategy');
            return reply.status(500).send({
                error: 'Database Error',
                message: 'Failed to fetch strategy',
            });
        }

        return strategy;
    });

    /**
     * POST /api/strategy
     * Create a new strategy with allocations
     */
    fastify.post('/', {
        schema: {
            description: 'Create a new strategy',
            tags: ['Strategy'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['name', 'mode', 'amount', 'duration_years', 'allocations'],
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 100 },
                    description: { type: 'string', maxLength: 500 },
                    mode: { type: 'string', enum: ['lumpsum', 'sip', 'goal', 'withdrawal'] },
                    amount: { type: 'number', minimum: 0 },
                    currency: { type: 'string', default: 'INR' },
                    duration_years: { type: 'number', minimum: 0.5, maximum: 50 },
                    compounding: { type: 'string', enum: ['daily', 'monthly', 'quarterly', 'annually'] },
                    normalize_mode: { type: 'boolean' },
                    inflation_rate: { type: 'number', minimum: 0, maximum: 0.5 },
                    tags: { type: 'array', items: { type: 'string' } },
                    allocations: {
                        type: 'array',
                        minItems: 1,
                        items: {
                            type: 'object',
                            required: ['category', 'percent', 'expected_annual_return'],
                            properties: {
                                category: { type: 'string', minLength: 1 },
                                percent: { type: 'number', minimum: 0, maximum: 100 },
                                expected_annual_return: { type: 'number', minimum: -0.5, maximum: 1 },
                            },
                        },
                    },
                },
            },
        },
        preHandler: [authMiddleware],
    }, async (request: FastifyRequest<{ Body: CreateStrategyBody }>, reply: FastifyReply) => {
        const client = getAuthClient(request);
        const {
            name,
            description,
            mode,
            amount,
            currency = 'INR',
            duration_years,
            compounding = 'monthly',
            normalize_mode = true,
            inflation_rate = 0.05,
            tags = [],
            allocations
        } = request.body;

        // Normalize allocations if needed
        const calcAllocations: CalcAllocation[] = allocations.map(a => ({
            category: a.category,
            percent: a.percent,
            expectedAnnualReturn: a.expected_annual_return,
        }));

        const normResult = normalizeAllocations(calcAllocations, !normalize_mode);
        if (!normResult.success) {
            return reply.status(400).send({
                error: 'Validation Error',
                message: normResult.error,
            });
        }

        // Create strategy
        const { data: strategy, error: strategyError } = await client
            .from('strategies')
            .insert({
                user_id: request.userId,
                name,
                description,
                mode,
                amount,
                currency,
                duration_years,
                compounding,
                normalize_mode,
                inflation_rate,
                tags,
            })
            .select()
            .single();

        if (strategyError) {
            request.log.error(strategyError, 'Failed to create strategy');
            return reply.status(500).send({
                error: 'Database Error',
                message: 'Failed to create strategy',
            });
        }

        // Insert allocations
        const allocationRows = normResult.allocations.map(a => ({
            strategy_id: strategy.id,
            category: a.category,
            percent: a.percent,
            percent_normalized: a.percentNormalized,
            amount: (amount * (a.percentNormalized ?? a.percent)) / 100,
            expected_annual_return: a.expectedAnnualReturn,
        }));

        const { error: allocError } = await client
            .from('allocations')
            .insert(allocationRows);

        if (allocError) {
            request.log.error(allocError, 'Failed to create allocations');
            // Clean up strategy
            await client.from('strategies').delete().eq('id', strategy.id);
            return reply.status(500).send({
                error: 'Database Error',
                message: 'Failed to create allocations',
            });
        }

        // Fetch complete strategy
        const { data: completeStrategy } = await client
            .from('strategies')
            .select('*, allocations(*)')
            .eq('id', strategy.id)
            .single();

        return reply.status(201).send(completeStrategy);
    });

    /**
     * POST /api/strategy/:id/project
     * Run projection on a strategy
     */
    fastify.post('/:id/project', {
        schema: {
            description: 'Run projection on a strategy',
            tags: ['Strategy'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                },
            },
            body: {
                type: 'object',
                properties: {
                    save_snapshot: { type: 'boolean', default: false },
                },
            },
        },
        preHandler: [authMiddleware],
    }, async (request: FastifyRequest<{
        Params: { id: string };
        Body: { save_snapshot?: boolean };
    }>, reply: FastifyReply) => {
        const client = getAuthClient(request);
        const { id } = request.params;
        const { save_snapshot = false } = request.body || {};

        // Fetch strategy with allocations
        const { data: strategy, error } = await client
            .from('strategies')
            .select('*, allocations(*)')
            .eq('id', id)
            .single();

        if (error || !strategy) {
            return reply.status(404).send({
                error: 'Not Found',
                message: 'Strategy not found',
            });
        }

        // Build projection params
        const params: ProjectionParams = {
            mode: strategy.mode as any,
            amount: Number(strategy.amount),
            durationYears: Number(strategy.duration_years),
            compounding: strategy.compounding as any,
            normalize: strategy.normalize_mode,
            inflationRate: strategy.inflation_rate ? Number(strategy.inflation_rate) : undefined,
            allocations: strategy.allocations.map((a: any) => ({
                category: a.category,
                percent: Number(a.percent),
                expectedAnnualReturn: Number(a.expected_annual_return),
            })),
        };

        // Run projection
        let projection;
        try {
            projection = projectPortfolio(params);
        } catch (err: any) {
            return reply.status(400).send({
                error: 'Projection Error',
                message: err.message,
            });
        }

        // Save snapshot if requested
        if (save_snapshot) {
            await client.from('projections').insert({
                strategy_id: id,
                snapshot: projection,
                aggregate_fv: projection.aggregate.futureValue,
                aggregate_cagr: projection.aggregate.cagr,
            });
        }

        return {
            strategy_id: id,
            ...projection,
        };
    });

    /**
     * POST /api/strategy/project
     * Run ad-hoc projection without saving strategy
     */
    fastify.post('/project', {
        schema: {
            description: 'Run ad-hoc projection calculation',
            tags: ['Strategy'],
            body: {
                type: 'object',
                required: ['mode', 'amount', 'duration_years', 'allocations'],
                properties: {
                    mode: { type: 'string', enum: ['lumpsum', 'sip', 'goal', 'withdrawal'] },
                    amount: { type: 'number', minimum: 0 },
                    duration_years: { type: 'number', minimum: 0.5, maximum: 50 },
                    compounding: { type: 'string', enum: ['daily', 'monthly', 'quarterly', 'annually'] },
                    normalize: { type: 'boolean', default: true },
                    inflation_rate: { type: 'number', minimum: 0, maximum: 0.5 },
                    allocations: {
                        type: 'array',
                        minItems: 1,
                        items: {
                            type: 'object',
                            required: ['category', 'percent', 'expected_annual_return'],
                            properties: {
                                category: { type: 'string' },
                                percent: { type: 'number' },
                                expected_annual_return: { type: 'number' },
                            },
                        },
                    },
                },
            },
        },
        preHandler: [optionalAuthMiddleware],
    }, async (request: FastifyRequest<{ Body: ProjectStrategyBody }>, reply: FastifyReply) => {
        const {
            mode = 'lumpsum',
            amount = 0,
            duration_years = 10,
            compounding = 'monthly',
            normalize = true,
            inflation_rate,
            allocations = [],
        } = request.body;

        const params: ProjectionParams = {
            mode: mode as any,
            amount,
            durationYears: duration_years,
            compounding: compounding as any,
            normalize,
            inflationRate: inflation_rate,
            allocations: allocations.map(a => ({
                category: a.category,
                percent: a.percent,
                expectedAnnualReturn: a.expected_annual_return,
            })),
        };

        try {
            const projection = projectPortfolio(params);
            return projection;
        } catch (err: any) {
            return reply.status(400).send({
                error: 'Projection Error',
                message: err.message,
            });
        }
    });

    /**
     * DELETE /api/strategy/:id
     * Delete a strategy
     */
    fastify.delete('/:id', {
        schema: {
            description: 'Delete a strategy',
            tags: ['Strategy'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                },
            },
        },
        preHandler: [authMiddleware],
    }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const client = getAuthClient(request);
        const { id } = request.params;

        const { error } = await client
            .from('strategies')
            .delete()
            .eq('id', id)
            .eq('user_id', request.userId);

        if (error) {
            request.log.error(error, 'Failed to delete strategy');
            return reply.status(500).send({
                error: 'Database Error',
                message: 'Failed to delete strategy',
            });
        }

        return { success: true };
    });

    /**
     * POST /api/strategy/:id/save-template
     * Save strategy as a reusable template
     */
    fastify.post('/:id/save-template', {
        schema: {
            description: 'Save strategy as template',
            tags: ['Strategy'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string', format: 'uuid' },
                },
            },
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    is_public: { type: 'boolean', default: false },
                },
            },
        },
        preHandler: [authMiddleware],
    }, async (request: FastifyRequest<{
        Params: { id: string };
        Body: { name?: string; description?: string; is_public?: boolean };
    }>, reply: FastifyReply) => {
        const client = getAuthClient(request);
        const { id } = request.params;
        const { name, description, is_public = false } = request.body || {};

        // Fetch strategy with allocations
        const { data: strategy, error } = await client
            .from('strategies')
            .select('*, allocations(*)')
            .eq('id', id)
            .single();

        if (error || !strategy) {
            return reply.status(404).send({
                error: 'Not Found',
                message: 'Strategy not found',
            });
        }

        // Create template
        const templateData = {
            mode: strategy.mode,
            compounding: strategy.compounding,
            normalize_mode: strategy.normalize_mode,
            allocations: strategy.allocations.map((a: any) => ({
                category: a.category,
                percent: a.percent,
                expected_annual_return: a.expected_annual_return,
            })),
        };

        const { data: template, error: templateError } = await client
            .from('saved_templates')
            .insert({
                user_id: request.userId,
                name: name || strategy.name,
                description: description || strategy.description,
                template_data: templateData,
                is_public,
            })
            .select()
            .single();

        if (templateError) {
            request.log.error(templateError, 'Failed to save template');
            return reply.status(500).send({
                error: 'Database Error',
                message: 'Failed to save template',
            });
        }

        return template;
    });
}
