import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export class AnalyticsService {
    async trackMetric(data: any) {
        logger.info('Tracking metric', data);
        return prisma.metric.create({ data });
    }

    async getMetricsByName(name: string) {
        return prisma.metric.findMany({
            where: { name },
            orderBy: { timestamp: 'desc' }
        });
    }

    async getSystemStats() {
        const totalEvents = await prisma.metric.count();
        const recentEvents = await prisma.metric.findMany({
            take: 10,
            orderBy: { timestamp: 'desc' }
        });

        return {
            totalEvents,
            recentEvents
        };
    }
}

export const analyticsService = new AnalyticsService();
