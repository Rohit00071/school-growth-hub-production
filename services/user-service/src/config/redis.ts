import Redis from 'ioredis';
import { logger } from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisManager {
    public client: Redis;
    public isConnected: boolean = false;

    constructor() {
        this.client = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 1,
            retryStrategy(times) {
                return null; // Don't retry indefinitely
            },
            enableOfflineQueue: false
        });

        this.client.on('connect', () => {
            logger.info('✅ Redis connected');
            this.isConnected = true;
        });

        this.client.on('error', (err) => {
            if (this.isConnected) {
                logger.error('Redis Client Error', err);
                this.isConnected = false;
            }
        });
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.isConnected) return null;
        try {
            const val = await this.client.get(key);
            return val ? JSON.parse(val) : null;
        } catch {
            return null;
        }
    }

    async setex(key: string, ttl: number, val: string): Promise<void> {
        if (!this.isConnected) return;
        try {
            await this.client.setex(key, ttl, val);
        } catch { }
    }

    disconnect() {
        this.client.disconnect();
    }
}

const manager = new RedisManager();
export const redis = manager.client;

export const CACHE_TTL = {
    USER: 3600,
    USER_PROFILE: 3600,
    PERMISSIONS: 1800
};

export const getOrFetch = async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 3600
): Promise<T> => {
    if (!manager.isConnected) return fetchFn();

    try {
        const cached = await manager.get<T>(key);
        if (cached) return cached;

        const data = await fetchFn();
        if (data) {
            await manager.setex(key, ttl, JSON.stringify(data));
        }
        return data;
    } catch (error) {
        return fetchFn();
    }
};
