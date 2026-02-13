import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from backend/monolith
dotenv.config({ path: path.join(__dirname, 'backend/monolith/.env') });

const prisma = new PrismaClient();

async function listTables() {
    try {
        console.log('Listing all tables in the database...');

        // List all tables and their schemas
        const tables: any[] = await prisma.$queryRaw`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_schema, table_name
        `;

        console.log('Found tables:');
        tables.forEach(t => console.log(` - ${t.table_schema}.${t.table_name}`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listTables();
