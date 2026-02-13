import prisma from './infrastructure/database/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    // Clear existing users and related data to ensure absolute fresh state with ONLY these users
    // deleting registrations, pdhours etc first to avoid foreign key violations if they exist
    await prisma.registration.deleteMany({});
    await prisma.pDHour.deleteMany({});
    await prisma.goal.deleteMany({});
    await prisma.observationDomain.deleteMany({});
    await prisma.observation.deleteMany({});
    await prisma.documentAcknowledgement.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('Cleared existing data.');

    const defaultPassword = 'password123'; // Fallback if needed, but we have specific ones

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
    }

    console.log('Seed data created successfully with users from Excel!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
