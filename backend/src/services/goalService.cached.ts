import { PrismaClient, Goal } from '@prisma/client';
import { redis, CACHE_TTL } from '../infrastructure/cache/redis';

const prisma = new PrismaClient();

/**
 * Goal Service with Redis Caching
 * Expected performance: 10-20x faster for cached queries
 */
export class GoalService {
    /**
     * Get goal by ID with caching
     * Cache TTL: 10 minutes
     */
    async getGoalById(id: string) {
        const cacheKey = `goal:${id}`;

        return redis.getOrFetch(
            cacheKey,
            async () => {
                const goal = await prisma.goal.findUnique({
                    where: { id },
                    include: {
                        teacher: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                avatarUrl: true
                            }
                        }
                    }
                });
                return goal;
            },
            CACHE_TTL.GOAL
        );
    }

    /**
     * Get goals by teacher with caching
     */
    async getGoalsByTeacher(
        teacherId: string,
        page: number = 1,
        limit: number = 50
    ) {
        const cacheKey = `goals:teacher:${teacherId}:page:${page}:limit:${limit}`;

        return redis.getOrFetch(
            cacheKey,
            async () => {
                const [goals, total] = await Promise.all([
                    prisma.goal.findMany({
                        where: { teacherId },
                        include: {
                            teacher: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true
                                }
                            }
                        },
                        orderBy: { dueDate: 'asc' },
                        skip: (page - 1) * limit,
                        take: limit
                    }),
                    prisma.goal.count({
                        where: { teacherId }
                    })
                ]);

                return { goals, total, page, limit };
            },
            CACHE_TTL.GOAL
        );
    }

    /**
     * Create goal and invalidate cache
     */
    async createGoal(data: any): Promise<Goal> {
        const goal = await prisma.goal.create({
            data,
            include: {
                teacher: true
            }
        });

        // Invalidate related caches
        await redis.delPattern(`goals:teacher:${goal.teacherId}:*`);
        await redis.del('dashboard:stats');

        return goal;
    }

    /**
     * Update goal and invalidate cache
     */
    async updateGoal(id: string, data: any): Promise<Goal> {
        const goal = await prisma.goal.update({
            where: { id },
            data,
            include: {
                teacher: true
            }
        });

        // Invalidate caches
        await redis.del(`goal:${id}`);
        await redis.delPattern(`goals:teacher:${goal.teacherId}:*`);

        return goal;
    }

    /**
     * Delete goal and invalidate cache
     */
    async deleteGoal(id: string): Promise<void> {
        const goal = await prisma.goal.findUnique({ where: { id } });

        if (goal) {
            await prisma.goal.delete({ where: { id } });

            // Invalidate caches
            await redis.del(`goal:${id}`);
            await redis.delPattern(`goals:teacher:${goal.teacherId}:*`);
            await redis.del('dashboard:stats');
        }
    }
}

export const goalService = new GoalService();
