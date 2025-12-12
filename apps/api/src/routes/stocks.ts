/**
 * Indian Stocks API Routes
 * 
 * Real-time NSE/BSE stock data, search, and watchlist management
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase.js';
import {
    getStockQuote,
    getMultipleQuotes,
    searchStocks,
    getPopularStocks,
    getAllStockSymbols,
    getStockDetails,
    getNifty50Symbols,
} from '../services/indianStocks.js';

export async function stockRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /api/stocks/quote/:symbol
     * Get real-time quote for a single stock
     */
    fastify.get('/quote/:symbol', {
        schema: {
            description: 'Get real-time stock quote',
            tags: ['Stocks'],
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
                    exchange: { type: 'string', enum: ['NSE', 'BSE'], default: 'NSE' },
                },
            },
        },
    }, async (
        request: FastifyRequest<{ Params: { symbol: string }; Querystring: { exchange?: 'NSE' | 'BSE' } }>,
        reply: FastifyReply
    ) => {
        const { symbol } = request.params;
        const exchange = request.query.exchange || 'NSE';

        const quote = await getStockQuote(symbol.toUpperCase(), exchange);

        if (!quote) {
            return reply.status(404).send({ error: 'Stock not found' });
        }

        return quote;
    });

    /**
     * GET /api/stocks/quotes
     * Get quotes for multiple stocks
     */
    fastify.get('/quotes', {
        schema: {
            description: 'Get quotes for multiple stocks',
            tags: ['Stocks'],
            querystring: {
                type: 'object',
                properties: {
                    symbols: { type: 'string', description: 'Comma-separated symbols' },
                    exchange: { type: 'string', enum: ['NSE', 'BSE'], default: 'NSE' },
                },
            },
        },
    }, async (
        request: FastifyRequest<{ Querystring: { symbols?: string; exchange?: 'NSE' | 'BSE' } }>,
        reply: FastifyReply
    ) => {
        const { symbols, exchange = 'NSE' } = request.query;

        if (!symbols) {
            return reply.status(400).send({ error: 'symbols parameter required' });
        }

        const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
        const quotes = await getMultipleQuotes(symbolList, exchange);

        return { quotes, count: quotes.length };
    });

    /**
     * GET /api/stocks/search
     * Search for stocks by name or symbol
     */
    fastify.get('/search', {
        schema: {
            description: 'Search stocks',
            tags: ['Stocks'],
            querystring: {
                type: 'object',
                properties: {
                    q: { type: 'string', description: 'Search query' },
                    limit: { type: 'integer', default: 20 },
                },
            },
        },
    }, async (
        request: FastifyRequest<{ Querystring: { q?: string; limit?: number } }>,
        reply: FastifyReply
    ) => {
        const { q = '', limit = 20 } = request.query;

        const results = searchStocks(q, limit);

        return { results, count: results.length };
    });

    /**
     * GET /api/stocks/popular
     * Get popular/trending stocks with quotes
     */
    fastify.get('/popular', {
        schema: {
            description: 'Get popular stocks with quotes',
            tags: ['Stocks'],
        },
    }, async () => {
        const quotes = await getPopularStocks();
        return { stocks: quotes, count: quotes.length };
    });

    /**
     * GET /api/stocks/all
     * Get all available stock symbols
     */
    fastify.get('/all', {
        schema: {
            description: 'Get all available stock symbols',
            tags: ['Stocks'],
        },
    }, async () => {
        const stocks = getAllStockSymbols();
        return { stocks, count: stocks.length };
    });

    /**
     * GET /api/stocks/nifty50
     * Get NIFTY 50 stocks
     */
    fastify.get('/nifty50', {
        schema: {
            description: 'Get NIFTY 50 stocks',
            tags: ['Stocks'],
        },
    }, async () => {
        const symbols = getNifty50Symbols();
        const quotes = await getMultipleQuotes(symbols.slice(0, 10), 'NSE'); // Limit to 10 for performance
        return { symbols, quotes, totalSymbols: symbols.length };
    });

    /**
     * GET /api/stocks/details/:symbol
     * Get detailed stock information
     */
    fastify.get('/details/:symbol', {
        schema: {
            description: 'Get detailed stock information',
            tags: ['Stocks'],
            params: {
                type: 'object',
                required: ['symbol'],
                properties: {
                    symbol: { type: 'string' },
                },
            },
        },
    }, async (
        request: FastifyRequest<{ Params: { symbol: string } }>,
        reply: FastifyReply
    ) => {
        const { symbol } = request.params;
        const details = await getStockDetails(symbol.toUpperCase());

        if (!details.quote) {
            return reply.status(404).send({ error: 'Stock not found' });
        }

        return details;
    });

    // ============ WATCHLIST ROUTES ============

    /**
     * GET /api/stocks/watchlist
     * Get user's watchlist
     */
    fastify.get('/watchlist', {
        schema: {
            description: 'Get user watchlist',
            tags: ['Watchlist'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).user?.id || 'demo-user';

        try {
            // Fetch watchlist from database
            const { data: watchlist, error } = await supabase
                .from('watchlist')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                // If table doesn't exist, return empty watchlist
                return { watchlist: [], quotes: [] };
            }

            if (!watchlist || watchlist.length === 0) {
                return { watchlist: [], quotes: [] };
            }

            // Get live quotes for watchlist stocks
            const symbols = watchlist.map(w => w.symbol);
            const quotes = await getMultipleQuotes(symbols, 'NSE');

            return {
                watchlist,
                quotes,
                count: watchlist.length,
            };
        } catch (err) {
            console.error('Watchlist fetch error:', err);
            return { watchlist: [], quotes: [] };
        }
    });

    /**
     * POST /api/stocks/watchlist
     * Add stock to watchlist
     */
    fastify.post('/watchlist', {
        schema: {
            description: 'Add stock to watchlist',
            tags: ['Watchlist'],
            body: {
                type: 'object',
                required: ['symbol'],
                properties: {
                    symbol: { type: 'string' },
                    exchange: { type: 'string', enum: ['NSE', 'BSE'], default: 'NSE' },
                    name: { type: 'string' },
                },
            },
        },
    }, async (
        request: FastifyRequest<{ Body: { symbol: string; exchange?: 'NSE' | 'BSE'; name?: string } }>,
        reply: FastifyReply
    ) => {
        const userId = (request as any).user?.id || 'demo-user';
        const { symbol, exchange = 'NSE', name } = request.body;

        try {
            // Check if already in watchlist
            const { data: existing } = await supabase
                .from('watchlist')
                .select('id')
                .eq('user_id', userId)
                .eq('symbol', symbol.toUpperCase())
                .single();

            if (existing) {
                return reply.status(400).send({ error: 'Stock already in watchlist' });
            }

            // Add to watchlist
            const { data, error } = await supabase
                .from('watchlist')
                .insert({
                    user_id: userId,
                    symbol: symbol.toUpperCase(),
                    exchange,
                    name: name || symbol,
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) {
                console.error('Watchlist insert error:', error);
                return reply.status(500).send({ error: 'Failed to add to watchlist' });
            }

            return { success: true, watchlistItem: data };
        } catch (err) {
            console.error('Watchlist add error:', err);
            return reply.status(500).send({ error: 'Failed to add to watchlist' });
        }
    });

    /**
     * DELETE /api/stocks/watchlist/:symbol
     * Remove stock from watchlist
     */
    fastify.delete('/watchlist/:symbol', {
        schema: {
            description: 'Remove stock from watchlist',
            tags: ['Watchlist'],
            params: {
                type: 'object',
                required: ['symbol'],
                properties: {
                    symbol: { type: 'string' },
                },
            },
        },
    }, async (
        request: FastifyRequest<{ Params: { symbol: string } }>,
        reply: FastifyReply
    ) => {
        const userId = (request as any).user?.id || 'demo-user';
        const { symbol } = request.params;

        try {
            const { error } = await supabase
                .from('watchlist')
                .delete()
                .eq('user_id', userId)
                .eq('symbol', symbol.toUpperCase());

            if (error) {
                console.error('Watchlist delete error:', error);
                return reply.status(500).send({ error: 'Failed to remove from watchlist' });
            }

            return { success: true, message: `${symbol} removed from watchlist` };
        } catch (err) {
            console.error('Watchlist remove error:', err);
            return reply.status(500).send({ error: 'Failed to remove from watchlist' });
        }
    });
}
