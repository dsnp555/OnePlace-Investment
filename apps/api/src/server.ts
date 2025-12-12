/**
 * OnePlace Invest API Server
 * 
 * Fastify server with Supabase integration, authentication, and investment APIs
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import dotenv from 'dotenv';

import { authRoutes } from './routes/auth.js';
import { profileRoutes } from './routes/profile.js';
import { strategyRoutes } from './routes/strategy.js';
import { marketRoutes } from './routes/market.js';
import { exportRoutes } from './routes/export.js';
import { notificationRoutes } from './routes/notifications.js';
import { recommendationRoutes } from './routes/recommendations.js';

// Load environment variables
dotenv.config({ path: '../../.env' });

const server = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
            },
        },
    },
});

// Register plugins
async function registerPlugins() {
    // CORS
    await server.register(cors, {
        origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:8081'],
        credentials: true,
    });

    // Security headers
    await server.register(helmet, {
        contentSecurityPolicy: false, // Disable for development
    });

    // Rate limiting
    await server.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
    });

    // Swagger documentation
    await server.register(swagger, {
        openapi: {
            info: {
                title: 'OnePlace Invest API',
                description: 'Investment planning and portfolio management API',
                version: '1.0.0',
            },
            servers: [
                {
                    url: `http://localhost:${process.env.API_PORT || 3001}`,
                    description: 'Development server',
                },
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
        },
    });

    await server.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
    });
}

// Register routes
async function registerRoutes() {
    // Health check
    server.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // API routes
    await server.register(authRoutes, { prefix: '/api/auth' });
    await server.register(profileRoutes, { prefix: '/api/profile' });
    await server.register(strategyRoutes, { prefix: '/api/strategy' });
    await server.register(marketRoutes, { prefix: '/api/markets' });
    await server.register(exportRoutes, { prefix: '/api/export' });
    await server.register(notificationRoutes, { prefix: '/api/notifications' });
    await server.register(recommendationRoutes, { prefix: '/api/recommendations' });
}

// Global error handler
server.setErrorHandler((error, request, reply) => {
    server.log.error(error);

    if (error.validation) {
        return reply.status(400).send({
            error: 'Validation Error',
            message: error.message,
            details: error.validation,
        });
    }

    if (error.statusCode === 401) {
        return reply.status(401).send({
            error: 'Unauthorized',
            message: error.message || 'Authentication required',
        });
    }

    if (error.statusCode === 403) {
        return reply.status(403).send({
            error: 'Forbidden',
            message: error.message || 'Access denied',
        });
    }

    if (error.statusCode === 404) {
        return reply.status(404).send({
            error: 'Not Found',
            message: error.message || 'Resource not found',
        });
    }

    // Default server error
    return reply.status(500).send({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : error.message,
    });
});

// Start server
async function start() {
    try {
        await registerPlugins();
        await registerRoutes();

        const port = parseInt(process.env.API_PORT || '3001', 10);
        const host = process.env.API_HOST || '0.0.0.0';

        await server.listen({ port, host });

        server.log.info(`Server running at http://${host}:${port}`);
        server.log.info(`API Documentation available at http://${host}:${port}/docs`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();

export { server };
