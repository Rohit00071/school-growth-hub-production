import { Observation } from '@prisma/client';
import { prisma } from '../config/prisma';
import { redis, CACHE_TTL } from '../utils/redis';
import { logger } from '../utils/logger';
import { eventBus, EVENT_CHANNELS } from '../utils/eventBus';

export class ObservationService {
    /**
     * Get observation by ID with caching
     */
    async getObservationById(id: string) {
        const cacheKey = `observation:${id}`;

        return redis.getOrFetch(
            cacheKey,
            async () => {
                logger.info(`Fetching observation ${id} from DB`);
                const observation = await prisma.observation.findUnique({
                    where: { id },
                    include: {
                        domainRatings: true
                    }
                });
                return observation;
            },
            CACHE_TTL.OBSERVATION
        );
    }

    /**
     * Get all observations with pagination and caching
     */
    async getAllObservations(page: number = 1, limit: number = 50) {
        const cacheKey = `observations:all:page:${page}:limit:${limit}`;

        return redis.getOrFetch(
            cacheKey,
            async () => {
                logger.info(`Fetching all observations page ${page} from DB`);
                const skip = (page - 1) * limit;

                const [observations, total] = await Promise.all([
                    prisma.observation.findMany({
                        skip,
                        take: limit,
                        orderBy: { date: 'desc' },
                        include: {
                            domainRatings: true
                        }
                    }),
                    prisma.observation.count()
                ]);

                return {
                    observations,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit)
                    }
                };
            },
            CACHE_TTL.OBSERVATION
        );
    }

    /**
     * Get observations by teacher with caching
     */
    async getObservationsByTeacher(
        teacherId: string,
        page: number = 1,
        limit: number = 50
    ) {
        const cacheKey = `observations:teacher:${teacherId}:page:${page}:limit:${limit}`;

        return redis.getOrFetch(
            cacheKey,
            async () => {
                logger.info(`Fetching observations for teacher ${teacherId} from DB`);
                const [observations, total] = await Promise.all([
                    prisma.observation.findMany({
                        where: { teacherId },
                        include: {
                            domainRatings: true
                        },
                        orderBy: { date: 'desc' },
                        skip: (page - 1) * limit,
                        take: limit
                    }),
                    prisma.observation.count({
                        where: { teacherId }
                    })
                ]);

                return { observations, total, page, limit };
            },
            CACHE_TTL.OBSERVATION
        );
    }

    /**
     * Get observations by observer with caching
     */
    async getObservationsByObserver(
        observerId: string,
        page: number = 1,
        limit: number = 50
    ) {
        const cacheKey = `observations:observer:${observerId}:page:${page}:limit:${limit}`;

        return redis.getOrFetch(
            cacheKey,
            async () => {
                logger.info(`Fetching observations by observer ${observerId} from DB`);
                const [observations, total] = await Promise.all([
                    prisma.observation.findMany({
                        where: { observerId },
                        include: {
                            domainRatings: true
                        },
                        orderBy: { date: 'desc' },
                        skip: (page - 1) * limit,
                        take: limit
                    }),
                    prisma.observation.count({
                        where: { observerId }
                    })
                ]);

                return { observations, total, page, limit };
            },
            CACHE_TTL.OBSERVATION
        );
    }

    /**
     * Create observation and invalidate cache
     */
    async createObservation(data: any): Promise<Observation> {
        logger.info('Creating new observation');
        const { domainRatings, ...rest } = data;
        const observation = await prisma.observation.create({
            data: {
                ...rest,
                domainRatings: domainRatings ? {
                    create: domainRatings
                } : undefined
            },
            include: {
                domainRatings: true
            }
        });

        // Invalidate related caches
        await redis.delPattern(`observations:teacher:${observation.teacherId}:*`);
        await redis.delPattern(`observations:observer:${observation.observerId}:*`);
        await redis.delPattern('observations:all:*');
        await redis.del('dashboard:stats');

        // Publish event for notification service
        await eventBus.publish(EVENT_CHANNELS.OBSERVATION_CREATED, {
            id: observation.id,
            teacherId: observation.teacherId,
            observerId: observation.observerId,
            score: observation.score,
            domain: observation.domain
        });

        return observation;
    }

    /**
     * Update observation and invalidate cache
     */
    async updateObservation(id: string, data: any): Promise<Observation> {
        logger.info(`Updating observation ${id}`);
        const observation = await prisma.observation.update({
            where: { id },
            data,
            include: {
                domainRatings: true
            }
        });

        // Invalidate caches
        await redis.del(`observation:${id}`);
        await redis.delPattern(`observations:teacher:${observation.teacherId}:*`);
        await redis.delPattern(`observations:observer:${observation.observerId}:*`);
        await redis.delPattern('observations:all:*');

        return observation;
    }

    /**
     * Delete observation and invalidate cache
     */
    async deleteObservation(id: string): Promise<void> {
        logger.info(`Deleting observation ${id}`);
        const observation = await prisma.observation.findUnique({ where: { id } });

        if (observation) {
            await prisma.observation.delete({ where: { id } });

            // Invalidate caches
            await redis.del(`observation:${id}`);
            await redis.delPattern(`observations:teacher:${observation.teacherId}:*`);
            await redis.delPattern(`observations:observer:${observation.observerId}:*`);
            await redis.delPattern('observations:all:*');
            await redis.del('dashboard:stats');
        }
    }

    /**
     * Get observation statistics with caching
     */
    async getObservationStats(teacherId: string) {
        const cacheKey = `observations:stats:${teacherId}`;

        return redis.getOrFetch(
            cacheKey,
            async () => {
                logger.info(`Calculating stats for teacher ${teacherId}`);
                const observations = await prisma.observation.findMany({
                    where: { teacherId },
                    select: {
                        score: true,
                        domain: true,
                        date: true,
                        status: true
                    }
                });

                if (observations.length === 0) {
                    return { total: 0, averageScore: 0, byDomain: {}, byStatus: {} };
                }

                const stats = {
                    total: observations.length,
                    averageScore: observations.reduce((sum, obs) => sum + obs.score, 0) / observations.length || 0,
                    byDomain: observations.reduce((acc: any, obs) => {
                        if (!acc[obs.domain]) {
                            acc[obs.domain] = { count: 0, totalScore: 0 };
                        }
                        acc[obs.domain].count++;
                        acc[obs.domain].totalScore += obs.score;
                        return acc;
                    }, {}),
                    byStatus: observations.reduce((acc: any, obs) => {
                        acc[obs.status] = (acc[obs.status] || 0) + 1;
                        return acc;
                    }, {})
                };

                return stats;
            },
            CACHE_TTL.OBSERVATION
        );
    }
}

export const observationService = new ObservationService();
