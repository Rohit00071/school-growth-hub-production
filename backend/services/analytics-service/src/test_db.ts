import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Connecting to:', process.env.DATABASE_URL);
        await prisma.$connect();
        console.log('✅ Connected!');
        const count = await prisma.metric.count();
        console.log('Count:', count);
    } catch (e) {
        console.error('❌ Connection failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
