import { PrismaClient, Observation } from '@prisma/client';
import { redis, CACHE_TTL } from '../infrastructure/cache/redis';

const prisma = new PrismaClient();

/**
 * Observation Service with Redis Caching
 * Expected performance: 50-100x faster for cached queries
 */
export class ObservationService {
    /**
     * Get observation by ID with caching
     * Cache TTL: 10 minutes
     */
    async getObservationById(id: string) {
        const cacheKey = `observation:${id}`;

        return redis.getOrFetch(
            cacheKey,
            async () => {
                const observation = await prisma.observation.findUnique({
                    where: { id },
                    include: {
                        teacher: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                avatarUrl: true
                            }
                        },
                        observer: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true
                            }
                        },
                        domainRatings: true
                    }
                });
                return observation;
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
                const [observations, total] = await Promise.all([
                    prisma.observation.findMany({
                        where: { teacherId },
                        include: {
                            observer: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true
                                }
                            },
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
                const [observations, total] = await Promise.all([
                    prisma.observation.findMany({
                        where: { observerId },
                        include: {
                            teacher: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true,
                                    avatarUrl: true
                                }
                            },
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
        const observation = await prisma.observation.create({
            data,
            include: {
                teacher: true,
                observer: true,
                domainRatings: true
            }
        });

        // Invalidate related caches
        await redis.delPattern(`observations:teacher:${observation.teacherId}:*`);
        await redis.delPattern(`observations:observer:${observation.observerId}:*`);
        await redis.del('dashboard:stats');

        return observation;
    }

    /**
     * Update observation and invalidate cache
     */
    async updateObservation(id: string, data: any): Promise<Observation> {
        const observation = await prisma.observation.update({
            where: { id },
            data,
            include: {
                teacher: true,
                observer: true,
                domainRatings: true
            }
        });

        // Invalidate caches
        await redis.del(`observation:${id}`);
        await redis.delPattern(`observations:teacher:${observation.teacherId}:*`);
        await redis.delPattern(`observations:observer:${observation.observerId}:*`);

        return observation;
    }

    /**
     * Delete observation and invalidate cache
     */
    async deleteObservation(id: string): Promise<void> {
        const observation = await prisma.observation.findUnique({ where: { id } });

        if (observation) {
            await prisma.observation.delete({ where: { id } });

            // Invalidate caches
            await redis.del(`observation:${id}`);
            await redis.delPattern(`observations:teacher:${observation.teacherId}:*`);
            await redis.delPattern(`observations:observer:${observation.observerId}:*`);
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
                const observations = await prisma.observation.findMany({
                    where: { teacherId },
                    select: {
                        score: true,
                        domain: true,
                        date: true,
                        status: true
                    }
                });

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
