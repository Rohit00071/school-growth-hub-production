import { PrismaClient } from '@prisma/client';

// Prisma Client Configuration for Enterprise Scalability
// Features: Connection pooling, query logging, error handling

const prismaClientSingleton = () => {
    return new PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
        ],
    });
};

// Create a separate client for read replicas if configured
const prismaReadClientSingleton = () => {
    if (process.env.DATABASE_READ_URL) {
        console.log('✅ Read Replica Configured');
        return new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_READ_URL,
                },
            },
            log: [{ emit: 'event', level: 'query' }, { emit: 'stdout', level: 'error' }],
        } as any); // Cast to any to avoid strict type checking on datasources override
    }
    return null;
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
    prismaRead: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();
const prismaRead = globalForPrisma.prismaRead ?? prismaReadClientSingleton() ?? prisma; // Fallback to primary

// Log slow queries (>100ms) for performance monitoring
// @ts-ignore
prisma.$on('query', (e: any) => {
    if (e.duration > 100) {
        console.warn(`⚠️ Slow Write Query (${e.duration}ms): ${e.query}`);
    }
});

if (prismaRead !== prisma) {
    // @ts-ignore
    prismaRead.$on('query', (e: any) => {
        if (e.duration > 100) {
            console.warn(`⚠️ Slow Read Query (${e.duration}ms): ${e.query}`);
        }
    });
}

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
    globalForPrisma.prismaRead = prismaRead;
}

export { prisma, prismaRead };
export default prisma;
