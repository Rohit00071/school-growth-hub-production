import { prisma } from './config/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    // Clear existing users
    await prisma.user.deleteMany({});
    console.log('Cleared existing users from user_service schema.');

    const users = [
        { name: 'Bharath', email: 'bharath.superadmin@pdi.com', pass: 'Bharath@123', role: 'SUPERADMIN' },
        { name: 'Indu', email: 'indu.management@pdi.com', pass: 'Indu@123', role: 'MANAGEMENT' },
        { name: 'Rohit', email: 'rohit.schoolleader@pdi.com', pass: 'Rohit@123', role: 'LEADER' },
        { name: 'Avani', email: 'avani.admin@pdi.com', pass: 'Avani@123', role: 'ADMIN' },
        { name: 'Teacher One', email: 'teacher1.btmlayout@pdi.com', pass: 'Teacher1@123', role: 'TEACHER' },
        { name: 'Teacher Two', email: 'teacher2.jpnagar@pdi.com', pass: 'Teacher2@123', role: 'TEACHER' },
        { name: 'Teacher Three', email: 'teacher3.itpl@pdi.com', pass: 'Teacher3@123', role: 'TEACHER' }
    ];

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.pass, 10);
        await prisma.user.create({
            data: {
                fullName: u.name,
                email: u.email,
                password: hashedPassword,
                role: u.role as any
            }
        });
        console.log(`Created user: ${u.email}`);
    }

    console.log('✅ User Service seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
