/**
 * News API Routes
 * 
 * Financial news endpoints for market updates and stock-specific news
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
    getMarketNews,
    getStockNews,
    getTopicNews,
    getMarketSentiment,
} from '../services/newsService.js';

export async function newsRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /api/news
     * Get latest market news
     */
    fastify.get('/', {
        schema: {
            description: 'Get latest financial news',
            tags: ['News'],
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'integer', default: 10 },
                },
            },
        },
    }, async (
        request: FastifyRequest<{ Querystring: { limit?: number } }>,
        reply: FastifyReply
    ) => {
        const { limit = 10 } = request.query;
        const feed = await getMarketNews(limit);
        const sentiment = getMarketSentiment(feed.articles);

        return {
            ...feed,
            sentiment,
        };
    });

    /**
     * GET /api/news/stock/:symbol
     * Get news for a specific stock
     */
    fastify.get('/stock/:symbol', {
        schema: {
            description: 'Get news for a specific stock',
            tags: ['News'],
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
        const feed = await getStockNews([symbol.toUpperCase()]);

        return feed;
    });

    /**
     * GET /api/news/topic/:topic
     * Get news by topic
     */
    fastify.get('/topic/:topic', {
        schema: {
            description: 'Get news by topic',
            tags: ['News'],
            params: {
                type: 'object',
                required: ['topic'],
                properties: {
                    topic: {
                        type: 'string',
                        enum: ['technology', 'finance', 'economy', 'earnings', 'ipo', 'mergers'],
                    },
                },
            },
        },
    }, async (
        request: FastifyRequest<{ Params: { topic: 'technology' | 'finance' | 'economy' | 'earnings' | 'ipo' | 'mergers' } }>,
        reply: FastifyReply
    ) => {
        const { topic } = request.params;
        const feed = await getTopicNews(topic);

        return feed;
    });

    /**
     * GET /api/news/sentiment
     * Get current market sentiment
     */
    fastify.get('/sentiment', {
        schema: {
            description: 'Get market sentiment summary',
            tags: ['News'],
        },
    }, async () => {
        const feed = await getMarketNews(20);
        const sentiment = getMarketSentiment(feed.articles);

        return {
            sentiment,
            basedOn: feed.articles.length,
            lastUpdated: feed.lastUpdated,
        };
    });
}
