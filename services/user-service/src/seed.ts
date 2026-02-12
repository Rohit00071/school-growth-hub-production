import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding user_service...');

    const users = [
        { email: 'teacher@school.com', password: 'TeacherPass123!', fullName: 'School Teacher', role: 'TEACHER' },
        { email: 'admin@school.com', password: 'AdminPass123!', fullName: 'Admin User', role: 'ADMIN' },
        { email: 'leader@school.com', password: 'LeaderPass123!', fullName: 'School Leader', role: 'LEADER' }
    ];

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, 12);
        await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                email: u.email,
                password: hashedPassword,
                fullName: u.fullName,
                role: u.role as any
            }
        });
    }

    console.log('✅ User Service seeded successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
