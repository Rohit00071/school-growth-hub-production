import dotenv from 'dotenv';
dotenv.config({ override: true });

import app from './app';
import { logger } from './utils/logger';
import { prisma } from './config/prisma';
import { redis } from './utils/redis';
import { eventBus, EVENT_CHANNELS } from './utils/eventBus';
import { analyticsService } from './services/analyticsService';

const PORT = process.env.PORT || 3006;

const startServer = async () => {
    try {
        const dbUrl = process.env.DATABASE_URL;
        logger.info(`DATABASE_URL starts with: ${dbUrl?.substring(0, 20)}...`);
        await prisma.$connect();
        logger.info('✅ Database connected');

        // Start Event Bus Subscriptions
        Object.values(EVENT_CHANNELS).forEach(channel => {
            eventBus.subscribe(channel, async (data) => {
                logger.info(`Received event on ${channel}`, data);
                await analyticsService.trackMetric({
                    name: channel,
                    value: 1.0,
                    userId: data.userId || data.teacherId || null,
                    metadata: data
                });
            });
        });

        app.listen(PORT, () => {
            logger.info(`🚀 Analytics Service running on port ${PORT}`);
        });

    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
};

startServer();

process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully');
    await prisma.$disconnect();
    await redis.disconnect();
    process.exit(0);
});
