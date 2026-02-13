
import { redis } from './utils/redis';
import { logger } from './utils/logger';

async function clearCache() {
    try {
        logger.info('Clearing all observation caches...');
        await redis.delPattern('observations:*');
        await redis.delPattern('dashboard:*');
        logger.info('✅ Cache cleared successfully!');
    } catch (error) {
        logger.error('Failed to clear cache:', error);
    } finally {
        process.exit(0);
    }
}

clearCache();
