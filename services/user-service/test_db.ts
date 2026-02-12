import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
    try {
        console.log('Testing database connection...');

        // Test connection
        await prisma.$connect();
        console.log('✅ Connected to database');

        // Test query
        const result = await prisma.$queryRaw`SELECT current_database(), current_schema()`;
        console.log('✅ Query successful:', result);

        // List schemas
        const schemas = await prisma.$queryRaw`SELECT schema_name FROM information_schema.schemata`;
        console.log('✅ Available schemas:', schemas);

        // Check if user_service schema exists
        const userServiceSchema = await prisma.$queryRaw`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name = 'user_service'
        `;
        console.log('✅ user_service schema:', userServiceSchema);

        // Try to query User table
        try {
            const users = await prisma.user.findMany();
            console.log('✅ Users found:', users.length);
        } catch (error) {
            console.error('❌ Error querying users:', error);
        }

    } catch (error) {
        console.error('❌ Database connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
