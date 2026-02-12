import Redis from 'ioredis';
import { logger } from './logger';

class RedisCache {
    private client: Redis;
    private isConnected: boolean = false;

    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        this.client = new Redis(redisUrl, {
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true
        });

        this.client.on('connect', () => {
            logger.info('✅ Redis connected');
            this.isConnected = true;
        });

        this.client.on('error', (err) => {
            // Silence error after initial log to avoid spam
            if (this.isConnected) {
                logger.error(`❌ Redis error: ${err.message}`);
                this.isConnected = false;
            }
        });

        this.client.on('close', () => {
            if (this.isConnected) {
                logger.warn('⚠️  Redis connection closed');
                this.isConnected = false;
            }
        });
    }

    getClient(): Redis {
        return this.client;
    }

    async connect(): Promise<void> {
        try {
            await this.client.connect().catch(() => {
                logger.warn('⚠️  Redis connection failed. Caching disabled.');
            });
        } catch (error: any) {
            logger.warn('⚠️  Redis connection failed. Caching disabled.');
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.isConnected) return null;
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error: any) {
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
        if (!this.isConnected) return;
        try {
            await this.client.setex(key, ttlSeconds, JSON.stringify(value));
        } catch (error: any) {
            // Silently fail
        }
    }

    async del(key: string): Promise<void> {
        if (!this.isConnected) return;
        try {
            await this.client.del(key);
        } catch (error: any) {
            // Silently fail
        }
    }

    async delPattern(pattern: string): Promise<void> {
        if (!this.isConnected) return;
        try {
            let cursor = '0';
            do {
                const [newCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = newCursor;
                if (keys.length > 0) {
                    await this.client.del(...keys);
                }
            } while (cursor !== '0');
        } catch (error: any) {
            // Silently fail
        }
    }

    async getOrFetch<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttl: number = 3600
    ): Promise<T> {
        if (!this.isConnected) return fetchFn();

        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }
        const value = await fetchFn();
        if (value !== null && value !== undefined) {
            await this.set(key, value, ttl);
        }
        return value;
    }

    async disconnect(): Promise<void> {
        await this.client.quit();
    }
}

export const redis = new RedisCache();

export const CACHE_TTL = {
    USER: 3600,
    OBSERVATION: 600,
    GOAL: 600,
    DOCUMENT: 600,
    DASHBOARD_STATS: 300,
};
