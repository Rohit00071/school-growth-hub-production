import { PrismaClient, User, Role } from '@prisma/client';
import { redis, CACHE_TTL } from '../infrastructure/cache/redis';

const prisma = new PrismaClient();

/**
 * User Service with Redis Caching
 * Expected performance: 10-50x faster for cached queries
 */
export class UserService {
    /**
     * Get user by ID with caching
     * Cache TTL: 1 hour
     * Expected hit rate: 70-90%
     */
    async getUserById(userId: string): Promise<User | null> {
        const cacheKey = `user:${userId}`;

        return redis.getOrFetch(
            cacheKey,
            async () => {
                const user = await prisma.user.findUnique({
                    where: { id: userId }
                });
                return user;
            },
            CACHE_TTL.USER_PROFILE
        );
    }

    /**
     * Get user by email with caching
     */
    async getUserByEmail(email: string): Promise<User | null> {
        const cacheKey = `user:email:${email}`;

        return redis.getOrFetch(
            cacheKey,
            async () => {
                const user = await prisma.user.findUnique({
                    where: { email }
                });
                return user;
            },
            CACHE_TTL.USER_PROFILE
        );
    }

    /**
     * Get users by role with caching
     */
    async getUsersByRole(role: Role, page: number = 1, limit: number = 50) {
        const cacheKey = `users:role:${role}:page:${page}:limit:${limit}`;

        return redis.getOrFetch(
            cacheKey,
            async () => {
                const [users, total] = await Promise.all([
                    prisma.user.findMany({
                        where: { role, isActive: true },
                        select: {
                            id: true,
                            email: true,
                            fullName: true,
                            role: true,
                            avatarUrl: true,
                            campusId: true,
                            department: true
                        },
                        skip: (page - 1) * limit,
                        take: limit,
                        orderBy: { fullName: 'asc' }
                    }),
                    prisma.user.count({
                        where: { role, isActive: true }
                    })
                ]);

                return { users, total, page, limit };
            },
            CACHE_TTL.USER_PROFILE
        );
    }

    /**
     * Update user and invalidate cache
     */
    async updateUser(userId: string, data: Partial<User>): Promise<User> {
        // Update database
        const user = await prisma.user.update({
            where: { id: userId },
            data
        });

        // Invalidate caches
        await redis.del(`user:${userId}`);
        await redis.del(`user:email:${user.email}`);
        await redis.delPattern(`users:role:${user.role}:*`);

        // Invalidate related caches
        await redis.delPattern(`observations:teacher:${userId}:*`);
        await redis.delPattern(`observations:observer:${userId}:*`);
        await redis.delPattern(`goals:teacher:${userId}:*`);

        return user;
    }

    /**
     * Delete user and invalidate cache
     */
    async deleteUser(userId: string): Promise<void> {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (user) {
            // Soft delete
            await prisma.user.update({
                where: { id: userId },
                data: { isActive: false }
            });

            // Invalidate caches
            await redis.del(`user:${userId}`);
            await redis.del(`user:email:${user.email}`);
            await redis.delPattern(`users:role:${user.role}:*`);
        }
    }
}

export const userService = new UserService();
