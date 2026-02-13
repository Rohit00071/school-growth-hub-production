import dotenv from 'dotenv';
dotenv.config({ override: true });

import app from './app';
import { logger } from './utils/logger';
import { prisma } from './config/prisma';
import { redis } from './utils/redis';

const PORT = process.env.PORT || 3003;

const startServer = async () => {
    try {
        await prisma.$connect();
        logger.info('✅ Database connected');

        // Subscribe to User Deletion
        const { eventBus, EVENT_CHANNELS } = require('./utils/eventBus');
        await eventBus.subscribe(EVENT_CHANNELS.USER_DELETED, async (data: { userId: string }) => {
            logger.info(`Received USER_DELETED event for ${data.userId}. Cleaning up goals.`);
            // Delete tasks first if they exist (depending on schema relationships)
            // Assuming cascade delete is NOT set in Prisma for simplicity of this script
            await prisma.goal.deleteMany({
                where: { teacherId: data.userId }
            });
        });

        app.listen(PORT, () => {
            logger.info(`🚀 Goal Service running on port ${PORT}`);
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
