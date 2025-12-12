/**
 * Market Data Routes
 * 
 * Market indices, prices, and mock data for development
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase.js';
import { DEFAULT_ASSET_CATEGORIES } from '@oneplace/calc';
import {
    getQuote,
    searchSymbols,
    getDailyPrices,
    getRateLimitStatus,
    POPULAR_INDIAN_SYMBOLS,
} from '../services/alphaVantage.js';

// Mock market data for development
const MOCK_MARKET_DATA = {
    indices: [
        { symbol: 'NIFTY50', name: 'Nifty 50', price: 19750.25, change: 0.45 },
        { symbol: 'SENSEX', name: 'BSE Sensex', price: 65890.50, change: 0.52 },
        { symbol: 'BANKNIFTY', name: 'Bank Nifty', price: 44250.00, change: -0.15 },
    ],
    commodities: [
        { symbol: 'GOLD', name: 'Gold (₹/10g)', price: 62500, change: -0.15 },
        { symbol: 'SILVER', name: 'Silver (₹/kg)', price: 76500, change: 0.28 },
    ],
    crypto: [
        { symbol: 'BTC', name: 'Bitcoin', price: 3700000, change: 2.15 },
        { symbol: 'ETH', name: 'Ethereum', price: 195000, change: 1.85 },
    ],
    rates: [
        { symbol: 'RBI_REPO', name: 'RBI Repo Rate', value: 6.50 },
        { symbol: 'PPF', name: 'PPF Interest Rate', value: 7.10 },
        { symbol: 'FD_SBI', name: 'SBI FD Rate (1-2Y)', value: 6.80 },
    ],
    sentiment: {
        overall: 'bullish',
        fearGreedIndex: 65,
        volatilityIndex: 14.5,
    },
};

export async function marketRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /api/markets/summary
     * Get market summary with indices and sentiment
     */
    fastify.get('/summary', {
        schema: {
            description: 'Get market summary',
            tags: ['Market'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        indices: { type: 'array' },
                        commodities: { type: 'array' },
                        crypto: { type: 'array' },
                        rates: { type: 'array' },
                        sentiment: { type: 'object' },
                        lastUpdated: { type: 'string' },
                    },
                },
            },
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // Try to fetch from cache first
        const { data: cached, error } = await supabase
            .from('market_cache')
            .select('*')
            .order('fetched_at', { ascending: false })
            .limit(20);

        if (!error && cached && cached.length > 0) {
            // Group by category
            const grouped: Record<string, any[]> = {};
            cached.forEach(item => {
                const category = item.category || 'other';
                if (!grouped[category]) grouped[category] = [];
                grouped[category].push({
                    symbol: item.symbol,
                    name: item.name,
                    price: item.price,
                    change: item.change_percent,
                    ...item.extra_data,
                });
            });

            return {
                ...grouped,
                sentiment: MOCK_MARKET_DATA.sentiment,
                lastUpdated: cached[0].fetched_at,
            };
        }

        // Return mock data if cache is empty
        return {
            ...MOCK_MARKET_DATA,
            lastUpdated: new Date().toISOString(),
        };
    });

    /**
     * GET /api/markets/categories
     * Get available asset categories with default returns
     */
    fastify.get('/categories', {
        schema: {
            description: 'Get available asset categories',
            tags: ['Market'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        return {
            categories: DEFAULT_ASSET_CATEGORIES.map(cat => ({
                id: cat.id,
                name: cat.name,
                defaultReturn: Math.round(cat.defaultExpectedReturn * 10000) / 100, // Convert to percentage
                riskLevel: cat.riskLevel,
            })),
        };
    });

    /**
     * GET /api/markets/price/:symbol
     * Get current price for a symbol
     */
    fastify.get('/price/:symbol', {
        schema: {
            description: 'Get price for a symbol',
            tags: ['Market'],
            params: {
                type: 'object',
                required: ['symbol'],
                properties: {
                    symbol: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { symbol: string } }>, reply: FastifyReply) => {
        const { symbol } = request.params;

        // Check cache
        const { data: cached, error } = await supabase
            .from('market_cache')
            .select('*')
            .eq('symbol', symbol.toUpperCase())
            .single();

        if (!error && cached) {
            return {
                symbol: cached.symbol,
                name: cached.name,
                price: cached.price,
                change: cached.change_percent,
                lastUpdated: cached.fetched_at,
                ...cached.extra_data,
            };
        }

        // Check mock data
        const allMock = [
            ...MOCK_MARKET_DATA.indices,
            ...MOCK_MARKET_DATA.commodities,
            ...MOCK_MARKET_DATA.crypto,
        ];
        const found = allMock.find(m => m.symbol === symbol.toUpperCase());

        if (found) {
            return {
                ...found,
                lastUpdated: new Date().toISOString(),
            };
        }

        return reply.status(404).send({
            error: 'Not Found',
            message: `Symbol ${symbol} not found`,
        });
    });

    /**
     * GET /api/markets/historical/:symbol
     * Get historical price data (mock)
     */
    fastify.get('/historical/:symbol', {
        schema: {
            description: 'Get historical price data',
            tags: ['Market'],
            params: {
                type: 'object',
                required: ['symbol'],
                properties: {
                    symbol: { type: 'string' },
                },
            },
            querystring: {
                type: 'object',
                properties: {
                    period: { type: 'string', enum: ['1W', '1M', '3M', '6M', '1Y', '5Y'], default: '1Y' },
                },
            },
        },
    }, async (request: FastifyRequest<{
        Params: { symbol: string };
        Querystring: { period?: string };
    }>, reply: FastifyReply) => {
        const { symbol } = request.params;
        const { period = '1Y' } = request.query;

        // Generate mock historical data
        const periods: Record<string, number> = {
            '1W': 7,
            '1M': 30,
            '3M': 90,
            '6M': 180,
            '1Y': 365,
            '5Y': 1825,
        };

        const days = periods[period] || 365;
        const basePrice = 10000;
        const data: Array<{ date: string; price: number }> = [];

        let currentPrice = basePrice;
        const now = new Date();

        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // Random walk with slight upward bias
            const change = (Math.random() - 0.48) * 0.02;
            currentPrice *= (1 + change);

            data.push({
                date: date.toISOString().split('T')[0],
                price: Math.round(currentPrice * 100) / 100,
            });
        }

        return {
            symbol: symbol.toUpperCase(),
            period,
            data,
        };
    });

    /**
     * GET /api/markets/returns
     * Get historical returns by asset class
     */
    fastify.get('/returns', {
        schema: {
            description: 'Get historical returns by asset class',
            tags: ['Market'],
        },
    }, async () => {
        // Return historical average returns (approximate)
        return {
            returns: [
                { category: 'Stocks (Nifty 50)', '1Y': 12.5, '3Y': 14.2, '5Y': 11.8, '10Y': 12.0 },
                { category: 'Mutual Funds (Equity)', '1Y': 15.2, '3Y': 16.5, '5Y': 12.3, '10Y': 11.5 },
                { category: 'Gold', '1Y': 8.5, '3Y': 11.2, '5Y': 10.5, '10Y': 9.2 },
                { category: 'Fixed Deposits', '1Y': 6.5, '3Y': 6.2, '5Y': 6.8, '10Y': 7.5 },
                { category: 'PPF', '1Y': 7.1, '3Y': 7.6, '5Y': 7.8, '10Y': 8.0 },
                { category: 'Real Estate', '1Y': 5.2, '3Y': 6.8, '5Y': 8.2, '10Y': 9.5 },
                { category: 'Crypto (BTC)', '1Y': 45.0, '3Y': 25.0, '5Y': 55.0, '10Y': null },
            ],
            disclaimer: 'Past performance does not guarantee future results.',
            lastUpdated: new Date().toISOString(),
        };
    });

    // ========================================
    // Alpha Vantage Live Data Endpoints
    // ========================================

    /**
     * GET /api/markets/live/quote/:symbol
     * Get live quote from Alpha Vantage
     */
    fastify.get('/live/quote/:symbol', {
        schema: {
            description: 'Get live stock quote from Alpha Vantage',
            tags: ['Market', 'Alpha Vantage'],
            params: {
                type: 'object',
                required: ['symbol'],
                properties: {
                    symbol: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { symbol: string } }>, reply: FastifyReply) => {
        try {
            const { symbol } = request.params;
            const quote = await getQuote(symbol);
            return {
                ...quote,
                source: 'Alpha Vantage',
                rateLimitStatus: getRateLimitStatus(),
            };
        } catch (error: any) {
            const status = error.error === 'Rate Limit Exceeded' ? 429 : 400;
            return reply.status(status).send(error);
        }
    });

    /**
     * GET /api/markets/live/search
     * Search for symbols
     */
    fastify.get('/live/search', {
        schema: {
            description: 'Search for stock symbols',
            tags: ['Market', 'Alpha Vantage'],
            querystring: {
                type: 'object',
                required: ['q'],
                properties: {
                    q: { type: 'string', minLength: 1 },
                },
            },
        },
    }, async (request: FastifyRequest<{ Querystring: { q: string } }>, reply: FastifyReply) => {
        try {
            const { q } = request.query;
            const results = await searchSymbols(q);
            return {
                query: q,
                results,
                count: results.length,
                rateLimitStatus: getRateLimitStatus(),
            };
        } catch (error: any) {
            const status = error.error === 'Rate Limit Exceeded' ? 429 : 400;
            return reply.status(status).send(error);
        }
    });

    /**
     * GET /api/markets/live/history/:symbol
     * Get historical daily prices
     */
    fastify.get('/live/history/:symbol', {
        schema: {
            description: 'Get historical daily prices from Alpha Vantage',
            tags: ['Market', 'Alpha Vantage'],
            params: {
                type: 'object',
                required: ['symbol'],
                properties: {
                    symbol: { type: 'string' },
                },
            },
            querystring: {
                type: 'object',
                properties: {
                    full: { type: 'boolean', default: false },
                },
            },
        },
    }, async (request: FastifyRequest<{
        Params: { symbol: string };
        Querystring: { full?: boolean };
    }>, reply: FastifyReply) => {
        try {
            const { symbol } = request.params;
            const { full = false } = request.query;
            const history = await getDailyPrices(symbol, full ? 'full' : 'compact');
            return {
                ...history,
                source: 'Alpha Vantage',
                rateLimitStatus: getRateLimitStatus(),
            };
        } catch (error: any) {
            const status = error.error === 'Rate Limit Exceeded' ? 429 : 400;
            return reply.status(status).send(error);
        }
    });

    /**
     * GET /api/markets/live/popular
     * Get list of popular Indian stocks
     */
    fastify.get('/live/popular', {
        schema: {
            description: 'Get popular Indian stock symbols',
            tags: ['Market', 'Alpha Vantage'],
        },
    }, async () => {
        return {
            symbols: POPULAR_INDIAN_SYMBOLS,
            rateLimitStatus: getRateLimitStatus(),
        };
    });

    /**
     * GET /api/markets/live/rate-limit
     * Get current rate limit status
     */
    fastify.get('/live/rate-limit', {
        schema: {
            description: 'Get Alpha Vantage API rate limit status',
            tags: ['Market', 'Alpha Vantage'],
        },
    }, async () => {
        return getRateLimitStatus();
    });
}
