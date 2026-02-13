import Redis from 'ioredis';

/**
 * Redis Cache Manager
 * Provides centralized caching functionality with TTL management
 */
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
            console.log('✅ Redis connected');
            this.isConnected = true;
        });

        this.client.on('error', (err) => {
            console.error('❌ Redis error:', err.message);
            this.isConnected = false;
        });

        this.client.on('close', () => {
            console.log('⚠️  Redis connection closed');
            this.isConnected = false;
        });
    }

    /**
     * Connect to Redis
     */
    async connect(): Promise<void> {
        try {
            await this.client.connect();
        } catch (error: any) {
            console.error('Failed to connect to Redis:', error.message);
            throw error;
        }
    }

    /**
     * Get value from cache
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.isConnected) return null;

        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error: any) {
            console.error(`Cache GET error for key ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Set value in cache with TTL (in seconds)
     */
    async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
        if (!this.isConnected) return;

        try {
            await this.client.setex(key, ttlSeconds, JSON.stringify(value));
        } catch (error: any) {
            console.error(`Cache SET error for key ${key}:`, error.message);
        }
    }

    /**
     * Delete key from cache
     */
    async del(key: string): Promise<void> {
        if (!this.isConnected) return;

        try {
            await this.client.del(key);
        } catch (error: any) {
            console.error(`Cache DEL error for key ${key}:`, error.message);
        }
    }

    /**
     * Delete multiple keys matching pattern
     */
    async delPattern(pattern: string): Promise<void> {
        if (!this.isConnected) return;

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        } catch (error: any) {
            console.error(`Cache DEL pattern error for ${pattern}:`, error.message);
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        if (!this.isConnected) return false;

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error: any) {
            console.error(`Cache EXISTS error for key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Get remaining TTL for a key
     */
    async ttl(key: string): Promise<number> {
        if (!this.isConnected) return -1;

        try {
            return await this.client.ttl(key);
        } catch (error: any) {
            console.error(`Cache TTL error for key ${key}:`, error.message);
            return -1;
        }
    }

    /**
     * Increment counter
     */
    async incr(key: string): Promise<number> {
        if (!this.isConnected) return 0;

        try {
            return await this.client.incr(key);
        } catch (error: any) {
            console.error(`Cache INCR error for key ${key}:`, error.message);
            return 0;
        }
    }

    /**
     * Set expiration on existing key
     */
    async expire(key: string, seconds: number): Promise<void> {
        if (!this.isConnected) return;

        try {
            await this.client.expire(key, seconds);
        } catch (error: any) {
            console.error(`Cache EXPIRE error for key ${key}:`, error.message);
        }
    }

    /**
     * Get or fetch pattern - cache-aside
     */
    async getOrFetch<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttl: number = 3600
    ): Promise<T> {
        // Try cache first
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        // Cache miss - fetch from source
        const value = await fetchFn();

        // Store in cache
        if (value !== null && value !== undefined) {
            await this.set(key, value, ttl);
        }

        return value;
    }

    /**
     * Disconnect from Redis
     */
    async disconnect(): Promise<void> {
        await this.client.quit();
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        if (!this.isConnected) {
            return {
                connected: false,
                keys: 0,
                memory: 'N/A'
            };
        }

        try {
            const info = await this.client.info();
            const dbsize = await this.client.dbsize();

            return {
                connected: true,
                keys: dbsize,
                memory: this.parseInfo(info, 'used_memory_human'),
                hitRate: this.calculateHitRate(info)
            };
        } catch (error: any) {
            return {
                connected: false,
                error: error.message
            };
        }
    }

    private parseInfo(info: string, key: string): string {
        const match = info.match(new RegExp(`${key}:(.+)`));
        return match ? match[1].trim() : 'N/A';
    }

    private calculateHitRate(info: string): number {
        const hits = parseInt(this.parseInfo(info, 'keyspace_hits')) || 0;
        const misses = parseInt(this.parseInfo(info, 'keyspace_misses')) || 0;
        const total = hits + misses;
        return total > 0 ? Math.round((hits / total) * 100) : 0;
    }
}

// Export singleton instance
export const redis = new RedisCache();

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
    USER_PROFILE: 3600,        // 1 hour
    OBSERVATION: 600,          // 10 minutes
    GOAL: 600,                 // 10 minutes
    DOCUMENT: 1800,            // 30 minutes
    ACKNOWLEDGEMENT: 300,      // 5 minutes
    DASHBOARD_STATS: 300,      // 5 minutes
    SESSION: 86400,            // 24 hours
    RATE_LIMIT: 60             // 1 minute
};
