/**
 * Authentication Routes
 * 
 * Note: Most auth is handled directly by Supabase client-side.
 * These endpoints provide server-side utilities and token validation.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * POST /api/auth/validate
     * Validate a JWT token and return user info
     */
    fastify.post('/validate', {
        schema: {
            description: 'Validate JWT token and return user info',
            tags: ['Auth'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        valid: { type: 'boolean' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
        preHandler: [authMiddleware],
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        return {
            valid: true,
            user: {
                id: request.userId,
                email: request.userEmail,
            },
        };
    });

    /**
     * POST /api/auth/refresh
     * Refresh access token using refresh token
     */
    fastify.post('/refresh', {
        schema: {
            description: 'Refresh access token',
            tags: ['Auth'],
            body: {
                type: 'object',
                required: ['refresh_token'],
                properties: {
                    refresh_token: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Body: { refresh_token: string } }>, reply: FastifyReply) => {
        const { refresh_token } = request.body;

        const { data, error } = await supabase.auth.refreshSession({
            refresh_token,
        });

        if (error) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: error.message,
            });
        }

        return {
            access_token: data.session?.access_token,
            refresh_token: data.session?.refresh_token,
            expires_at: data.session?.expires_at,
        };
    });

    /**
     * POST /api/auth/signout
     * Sign out user (invalidate token)
     */
    fastify.post('/signout', {
        schema: {
            description: 'Sign out and invalidate token',
            tags: ['Auth'],
        },
        preHandler: [authMiddleware],
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        // Note: Actual sign out happens client-side with Supabase
        // Server can log the event or perform cleanup
        request.log.info({ userId: request.userId }, 'User signed out');

        return { success: true };
    });
}
