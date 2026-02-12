import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
        ],
    });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Log slow queries
// @ts-ignore
prisma.$on('query', (e: any) => {
    if (e.duration > 100) {
        logger.warn(`⚠️ Slow Query (${e.duration}ms): ${e.query}`);
    }
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export { prisma };
export default prisma;
