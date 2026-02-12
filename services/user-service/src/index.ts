import dotenv from 'dotenv';
dotenv.config({ override: true });

import app from './app';
import { logger } from './utils/logger';
import { prisma } from './config/prisma';
import { redis } from './config/redis';

const PORT = process.env.PORT || 3001;

const startServer = async () => {
    try {
        // Test Database Connection
        await prisma.$connect();
        logger.info('✅ Database connected');

        // Server
        app.listen(PORT, () => {
            logger.info(`🚀 User Service running on port ${PORT}`);
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
    redis.disconnect();
    process.exit(0);
});
