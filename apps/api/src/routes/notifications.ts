/**
 * Notifications API Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    createNotification,
    getTriggerConfig,
} from '../services/notifications.js';

export async function notificationRoutes(fastify: FastifyInstance): Promise<void> {
    /**
     * GET /api/notifications
     * Get all notifications for the current user
     */
    fastify.get('/', {
        schema: {
            description: 'Get user notifications',
            tags: ['Notifications'],
            querystring: {
                type: 'object',
                properties: {
                    unreadOnly: { type: 'boolean', default: false },
                },
            },
        },
    }, async (request: FastifyRequest<{ Querystring: { unreadOnly?: boolean } }>, reply: FastifyReply) => {
        // Get user ID from auth (mock for now)
        const userId = (request as any).user?.id || 'demo-user';
        const { unreadOnly = false } = request.query;

        const notifications = getUserNotifications(userId, unreadOnly);
        const unreadCount = getUnreadCount(userId);

        return {
            notifications,
            unreadCount,
            total: notifications.length,
        };
    });

    /**
     * GET /api/notifications/count
     * Get unread notification count
     */
    fastify.get('/count', {
        schema: {
            description: 'Get unread notification count',
            tags: ['Notifications'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).user?.id || 'demo-user';
        return { unreadCount: getUnreadCount(userId) };
    });

    /**
     * POST /api/notifications/:id/read
     * Mark a notification as read
     */
    fastify.post('/:id/read', {
        schema: {
            description: 'Mark notification as read',
            tags: ['Notifications'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'string' },
                },
            },
        },
    }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const { id } = request.params;
        const success = markAsRead(id);

        if (!success) {
            return reply.status(404).send({ error: 'Notification not found' });
        }

        return { success: true };
    });

    /**
     * POST /api/notifications/read-all
     * Mark all notifications as read
     */
    fastify.post('/read-all', {
        schema: {
            description: 'Mark all notifications as read',
            tags: ['Notifications'],
        },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        const userId = (request as any).user?.id || 'demo-user';
        const count = markAllAsRead(userId);

        return { success: true, markedRead: count };
    });

    /**
     * POST /api/notifications/test
     * Create a test notification (for development)
     */
    fastify.post('/test', {
        schema: {
            description: 'Create a test notification',
            tags: ['Notifications'],
            body: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    body: { type: 'string' },
                    type: { type: 'string', enum: ['milestone', 'alert', 'insight', 'reminder', 'system'] },
                },
            },
        },
    }, async (request: FastifyRequest<{
        Body: { title?: string; body?: string; type?: 'milestone' | 'alert' | 'insight' | 'reminder' | 'system' }
    }>, reply: FastifyReply) => {
        const userId = (request as any).user?.id || 'demo-user';
        const {
            title = 'Test Notification',
            body = 'This is a test notification',
            type = 'system'
        } = request.body || {};

        const notification = createNotification(userId, title, body, type);

        return { success: true, notification };
    });

    /**
     * GET /api/notifications/triggers
     * Get notification trigger configuration
     */
    fastify.get('/triggers', {
        schema: {
            description: 'Get notification triggers configuration',
            tags: ['Notifications'],
        },
    }, async () => {
        return { triggers: getTriggerConfig() };
    });
}
