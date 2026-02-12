import dotenv from 'dotenv';
dotenv.config({ override: true });

import app from './app';
import { logger } from './utils/logger';
import { prisma } from './config/prisma';

const PORT = process.env.PORT || 3002;

const startServer = async () => {
    try {
        // Test Database Connection
        await prisma.$connect();
        logger.info('✅ Database connected');

        // Subscribe to User Deletion
        const { eventBus, EVENT_CHANNELS } = require('./utils/eventBus');
        await eventBus.subscribe(EVENT_CHANNELS.USER_DELETED, async (data: { userId: string }) => {
            logger.info(`Received USER_DELETED event for ${data.userId}. Cleaning up observations.`);
            await prisma.observation.deleteMany({
                where: {
                    OR: [
                        { teacherId: data.userId },
                        { observerId: data.userId }
                    ]
                }
            });
        });

        // Server
        app.listen(PORT, () => {
            logger.info(`🚀 Observation Service running on port ${PORT}`);
        });

    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
};

startServer();

// Graceful Shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});
