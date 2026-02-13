import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
    const user = await prisma.user.findUnique({
        where: { email: 'bharath.superadmin@pdi.com' }
    });

    if (user) {
        console.log('User found:', {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            passwordHash: user.password.substring(0, 20) + '...'
        });
    } else {
        console.log('User NOT found!');
    }

    await prisma.$disconnect();
}

checkUser();
