import { prisma, prismaRead } from '../infrastructure/database/prisma';
import { CACHE_TTL, redis } from '../infrastructure/cache/redis';

/**
 * Analytics Service
 * Optimized for high-performance reporting using raw SQL and Read Replicas
 */
export class AnalyticsService {
    private db = prismaRead; // Use read replica by default

    /**
     * Get School Performance Overview
     * Calculates average scores per domain directly in DB
     * Cache: 1 hour
     */
    async getSchoolPerformance(schoolId: string) {
        const cacheKey = `analytics:school:${schoolId}:performance`;

        return redis.getOrFetch(
            cacheKey,
            async () => {
                // Optimized aggregation query
                const domainScores = await this.db.$queryRaw`
          SELECT 
            domain,
            AVG(score) as average_score,
            COUNT(*) as observation_count
          FROM "Observation"
          WHERE "teacherId" IN (
            SELECT id FROM "User" WHERE "campusId" = ${schoolId}
          )
          AND "createdAt" > NOW() - INTERVAL '6 months'
          GROUP BY domain
          ORDER BY average_score DESC;
        `;

                // Monthly trend query
                const monthlyTrend = await this.db.$queryRaw`
          SELECT 
            TO_CHAR("date", 'Mon YYYY') as month,
            AVG(score) as average_score,
            COUNT(*) as count
          FROM "Observation"
          WHERE "teacherId" IN (
            SELECT id FROM "User" WHERE "campusId" = ${schoolId}
          )
          AND "createdAt" > NOW() - INTERVAL '12 months'
          GROUP BY TO_CHAR("date", 'Mon YYYY'), DATE_TRUNC('month', "date")
          ORDER BY DATE_TRUNC('month', "date") ASC;
        `;

                return {
                    domainScores,
                    monthlyTrend
                };
            },
            CACHE_TTL.DASHBOARD_STATS // 5 mins (or increase if needed)
        );
    }

    /**
     * Get Top Performing Teachers
     * Uses efficient sorting and limiting at database level
     */
    async getTopTeachers(schoolId: string, limit: number = 5) {
        const cacheKey = `analytics:school:${schoolId}:top_teachers:${limit}`;

        return redis.getOrFetch(
            cacheKey,
            async () => {
                return this.db.$queryRaw`
          SELECT 
            u.id,
            u."fullName",
            u."avatarUrl",
            AVG(o.score) as average_score,
            COUNT(o.id) as observation_count
          FROM "User" u
          JOIN "Observation" o ON u.id = o."teacherId"
          WHERE u."campusId" = ${schoolId}
          AND o."createdAt" > NOW() - INTERVAL '6 months'
          GROUP BY u.id, u."fullName", u."avatarUrl"
          HAVING COUNT(o.id) >= 3
          ORDER BY average_score DESC
          LIMIT ${limit};
        `;
            },
            CACHE_TTL.DASHBOARD_STATS
        );
    }

    /**
     * Get Teacher Growth Trajectory
     * Calculates improvement over time
     */
    async getTeacherGrowth(teacherId: string) {
        const cacheKey = `analytics:teacher:${teacherId}:growth`;

        return redis.getOrFetch(
            cacheKey,
            async () => {
                return this.db.$queryRaw`
          WITH MonthlyStats AS (
            SELECT 
              DATE_TRUNC('month', "date") as month_date,
              AVG(score) as avg_score
            FROM "Observation"
            WHERE "teacherId" = ${teacherId}
            GROUP BY DATE_TRUNC('month', "date")
          )
          SELECT 
            TO_CHAR(month_date, 'Mon YYYY') as month,
            avg_score,
            LAG(avg_score) OVER (ORDER BY month_date) as prev_month_score,
            avg_score - LAG(avg_score) OVER (ORDER BY month_date) as growth
          FROM MonthlyStats
          ORDER BY month_date ASC;
        `;
            },
            CACHE_TTL.USER_PROFILE // 1 hour
        );
    }
}

export const analyticsService = new AnalyticsService();
