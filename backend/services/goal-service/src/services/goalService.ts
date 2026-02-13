import { Goal } from '@prisma/client';
import { prisma } from '../config/prisma';
import { redis, CACHE_TTL } from '../utils/redis';
import { logger } from '../utils/logger';
import { eventBus, EVENT_CHANNELS } from '../utils/eventBus';

export class GoalService {
    async getGoalById(id: string) {
        const cacheKey = `goal:${id}`;
        return redis.getOrFetch(
            cacheKey,
            async () => {
                logger.info(`Fetching goal ${id} from DB`);
                return prisma.goal.findUnique({ where: { id } });
            },
            CACHE_TTL.GOAL
        );
    }

    async getAllGoals(page: number = 1, limit: number = 50) {
        const cacheKey = `goals:all:page:${page}:limit:${limit}`;
        return redis.getOrFetch(
            cacheKey,
            async () => {
                logger.info(`Fetching all goals from DB`);
                const [goals, total] = await Promise.all([
                    prisma.goal.findMany({
                        orderBy: { createdAt: 'desc' },
                        skip: (page - 1) * limit,
                        take: limit
                    }),
                    prisma.goal.count()
                ]);
                return { goals, total, page, limit };
            },
            CACHE_TTL.GOAL
        );
    }

    async getGoalsByTeacher(teacherId: string, page: number = 1, limit: number = 50) {
        const cacheKey = `goals:teacher:${teacherId}:page:${page}:limit:${limit}`;
        return redis.getOrFetch(
            cacheKey,
            async () => {
                logger.info(`Fetching goals for teacher ${teacherId} from DB`);
                const [goals, total] = await Promise.all([
                    prisma.goal.findMany({
                        where: { teacherId },
                        orderBy: { createdAt: 'desc' },
                        skip: (page - 1) * limit,
                        take: limit
                    }),
                    prisma.goal.count({ where: { teacherId } })
                ]);
                return { goals, total, page, limit };
            },
            CACHE_TTL.GOAL
        );
    }

    async createGoal(data: any): Promise<Goal> {
        logger.info('Creating new goal');
        const goal = await prisma.goal.create({ data });

        // Invalidate cache
        await redis.delPattern(`goals:teacher:${goal.teacherId}:*`);

        // Publish event
        await eventBus.publish(EVENT_CHANNELS.GOAL_CREATED, {
            id: goal.id,
            teacherId: goal.teacherId,
            title: goal.title,
            status: goal.status,
            category: goal.category
        });

        return goal;
    }

    async updateGoal(id: string, data: any): Promise<Goal> {
        logger.info(`Updating goal ${id}`);
        const goal = await prisma.goal.update({
            where: { id },
            data
        });
        await redis.del(`goal:${id}`);
        await redis.delPattern(`goals:teacher:${goal.teacherId}:*`);
        return goal;
    }

    async deleteGoal(id: string): Promise<void> {
        logger.info(`Deleting goal ${id}`);
        const goal = await prisma.goal.findUnique({ where: { id } });
        if (goal) {
            await prisma.goal.delete({ where: { id } });
            await redis.del(`goal:${id}`);
            await redis.delPattern(`goals:teacher:${goal.teacherId}:*`);
        }
    }
}

export const goalService = new GoalService();
