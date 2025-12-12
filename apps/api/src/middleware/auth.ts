/**
 * Authentication Middleware
 * 
 * Validates Supabase JWT tokens and attaches user info to requests
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase, createAuthClient } from '../lib/supabase.js';

// Extend FastifyRequest type
declare module 'fastify' {
    interface FastifyRequest {
        userId?: string;
        userEmail?: string;
        accessToken?: string;
    }
}

/**
 * Extract and validate JWT token from request
 */
export async function authMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Missing or invalid authorization header',
        });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'Invalid or expired token',
            });
        }

        // Attach user info to request
        request.userId = user.id;
        request.userEmail = user.email;
        request.accessToken = token;
    } catch (err) {
        request.log.error(err, 'Auth middleware error');
        return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Token verification failed',
        });
    }
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
export async function optionalAuthMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return; // Continue without auth
    }

    const token = authHeader.substring(7);

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (!error && user) {
            request.userId = user.id;
            request.userEmail = user.email;
            request.accessToken = token;
        }
    } catch (err) {
        // Silently continue without auth
        request.log.warn(err, 'Optional auth check failed');
    }
}

/**
 * Get authenticated Supabase client for request
 */
export function getAuthClient(request: FastifyRequest) {
    if (!request.accessToken) {
        throw new Error('No access token available');
    }
    return createAuthClient(request.accessToken);
}
