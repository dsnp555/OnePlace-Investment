/**
 * Export Routes
 * 
 * CSV and PDF export functionality for strategies and projections
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, getAuthClient } from '../middleware/auth.js';
import { projectPortfolio, ProjectionParams } from '@oneplace/calc';

export async function exportRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /api/export/strategy/:id/csv
     * Export strategy as CSV
     */
    fastify.get('/strategy/:id/csv', {
        schema: {
            description: 'Export strategy as CSV',
            tags: ['Export'],
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

        // Fetch strategy
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

        // Run projection
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

        const projection = projectPortfolio(params);

        // Build CSV
        const lines: string[] = [];

        // Strategy info
        lines.push('OnePlace Invest - Strategy Export');
        lines.push(`Strategy Name,${strategy.name}`);
        lines.push(`Mode,${strategy.mode}`);
        lines.push(`Investment Amount,${strategy.amount} ${strategy.currency}`);
        lines.push(`Duration,${strategy.duration_years} years`);
        lines.push(`Compounding,${strategy.compounding}`);
        lines.push(`Inflation Rate,${(strategy.inflation_rate * 100).toFixed(2)}%`);
        lines.push('');

        // Allocations
        lines.push('ALLOCATIONS');
        lines.push('Category,Percent,Normalized %,Amount,Expected Return,Projected FV,CAGR');
        projection.normalizedAllocations.forEach(a => {
            const original = strategy.allocations.find((o: any) => o.category === a.category);
            lines.push([
                a.category,
                `${original?.percent ?? a.percentNormalized}%`,
                `${a.percentNormalized.toFixed(2)}%`,
                a.amount.toFixed(2),
                `${(params.allocations.find(p => p.category === a.category)?.expectedAnnualReturn ?? 0 * 100).toFixed(2)}%`,
                a.projectedFV.toFixed(2),
                `${(a.cagr * 100).toFixed(2)}%`,
            ].join(','));
        });
        lines.push('');

        // Aggregate
        lines.push('SUMMARY');
        lines.push(`Total Investment,${projection.aggregate.totalContributions.toFixed(2)}`);
        lines.push(`Projected Future Value,${projection.aggregate.futureValue.toFixed(2)}`);
        lines.push(`Total Returns,${projection.aggregate.totalReturns.toFixed(2)}`);
        lines.push(`Portfolio CAGR,${(projection.aggregate.cagr * 100).toFixed(2)}%`);
        if (projection.aggregate.realFutureValue) {
            lines.push(`Inflation-Adjusted FV,${projection.aggregate.realFutureValue.toFixed(2)}`);
        }
        lines.push('');

        // Yearly breakdown
        lines.push('YEARLY BREAKDOWN');
        lines.push('Year,Start Balance,Contributions,Interest,End Balance,Inflation-Adjusted');
        projection.yearlyBreakdown.forEach(y => {
            lines.push([
                y.year,
                y.startBalance.toFixed(2),
                y.contributions.toFixed(2),
                y.interest.toFixed(2),
                y.endBalance.toFixed(2),
                y.inflationAdjusted?.toFixed(2) ?? '',
            ].join(','));
        });

        const csv = lines.join('\n');

        return reply
            .header('Content-Type', 'text/csv')
            .header('Content-Disposition', `attachment; filename="${strategy.name.replace(/[^a-z0-9]/gi, '_')}_export.csv"`)
            .send(csv);
    });

    /**
     * GET /api/export/strategy/:id/json
     * Export strategy as JSON
     */
    fastify.get('/strategy/:id/json', {
        schema: {
            description: 'Export strategy as JSON',
            tags: ['Export'],
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

        // Fetch strategy
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

        // Run projection
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

        const projection = projectPortfolio(params);

        const exportData = {
            exportedAt: new Date().toISOString(),
            strategy: {
                name: strategy.name,
                description: strategy.description,
                mode: strategy.mode,
                amount: strategy.amount,
                currency: strategy.currency,
                durationYears: strategy.duration_years,
                compounding: strategy.compounding,
                inflationRate: strategy.inflation_rate,
            },
            allocations: strategy.allocations.map((a: any) => ({
                category: a.category,
                percent: a.percent,
                percentNormalized: a.percent_normalized,
                expectedAnnualReturn: a.expected_annual_return,
            })),
            projection,
        };

        return reply
            .header('Content-Type', 'application/json')
            .header('Content-Disposition', `attachment; filename="${strategy.name.replace(/[^a-z0-9]/gi, '_')}_export.json"`)
            .send(exportData);
    });

    /**
     * POST /api/export/pdf
     * Generate PDF report (returns base64 or URL to generated file)
     * Note: Full PDF generation would require jspdf on the client or a headless browser
     */
    fastify.post('/pdf', {
        schema: {
            description: 'Generate PDF report metadata (actual PDF generated client-side)',
            tags: ['Export'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['strategy_id'],
                properties: {
                    strategy_id: { type: 'string', format: 'uuid' },
                    include_charts: { type: 'boolean', default: true },
                },
            },
        },
        preHandler: [authMiddleware],
    }, async (request: FastifyRequest<{
        Body: { strategy_id: string; include_charts?: boolean }
    }>, reply: FastifyReply) => {
        const client = getAuthClient(request);
        const { strategy_id } = request.body;

        // Fetch strategy
        const { data: strategy, error } = await client
            .from('strategies')
            .select('*, allocations(*)')
            .eq('id', strategy_id)
            .single();

        if (error || !strategy) {
            return reply.status(404).send({
                error: 'Not Found',
                message: 'Strategy not found',
            });
        }

        // Run projection
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

        const projection = projectPortfolio(params);

        // Return data needed for client-side PDF generation
        return {
            reportTitle: `Investment Strategy: ${strategy.name}`,
            generatedAt: new Date().toISOString(),
            strategy: {
                ...strategy,
                allocations: strategy.allocations,
            },
            projection,
            // PDF will be generated client-side using this data
            pdfGenerationMethod: 'client-side',
            instructions: 'Use the returned data with jsPDF or similar library to generate PDF on the client.',
        };
    });
}
