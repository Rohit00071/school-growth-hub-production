import dotenv from 'dotenv';
dotenv.config({ override: true });

import app from './app';
import { logger } from './utils/logger';
import { prisma } from './config/prisma';
import { redis } from './utils/redis';
import { eventBus, EVENT_CHANNELS } from './utils/eventBus';
import { notificationService } from './services/notificationService';

const PORT = process.env.PORT || 3005;

const startServer = async () => {
    try {
        await prisma.$connect();
        logger.info('✅ Database connected');

        // Start Event Bus Subscriptions
        await eventBus.subscribe(EVENT_CHANNELS.OBSERVATION_CREATED, async (data) => {
            logger.info('Received observation_created event', data);
            await notificationService.createNotification({
                userId: data.teacherId,
                title: 'New Observation',
                message: `A new observation for ${data.domain} has been submitted.`,
                type: 'OBSERVATION',
                link: `/teacher/observations/${data.id}`
            });
        });

        await eventBus.subscribe(EVENT_CHANNELS.GOAL_CREATED, async (data) => {
            logger.info('Received goal_created event', data);
            await notificationService.createNotification({
                userId: data.teacherId,
                title: 'New Goal Set',
                message: `A new professional goal "${data.title}" has been created.`,
                type: 'GOAL',
                link: `/teacher/goals/${data.id}`
            });
        });

        await eventBus.subscribe(EVENT_CHANNELS.DOCUMENT_ACKNOWLEDGED, async (data) => {
            logger.info('Received document_acknowledged event', data);
            await notificationService.createNotification({
                userId: data.teacherId,
                title: 'Document Acknowledged',
                message: `You have successfully acknowledged the document.`,
                type: 'SYSTEM',
                link: `/teacher/documents`
            });
        });

        await eventBus.subscribe(EVENT_CHANNELS.USER_DELETED, async (data: { userId: string }) => {
            logger.info(`Received USER_DELETED event for ${data.userId}. Cleaning up notifications.`);
            await prisma.notification.deleteMany({
                where: { userId: data.userId }
            });
        });

        app.listen(PORT, () => {
            logger.info(`🚀 Notification Service running on port ${PORT}`);
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
