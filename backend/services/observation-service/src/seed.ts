import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding observation_service...');

    // Check if we have users to link to (though microservices usually handle this via IDs)
    // For testing, we'll just use the IDs of the users we seeded in user-service
    const teacherEmail = 'teacher1.btmlayout@pdi.com';
    const leaderEmail = 'rohit.schoolleader@pdi.com';

    // In a real microservice, we might not query the User table directly if it's in another DB,
    // but here it's in the same DB just different schema, and we defined it in schema.prisma.
    const teacher = await prisma.user.findUnique({ where: { email: teacherEmail } });
    const leader = await prisma.user.findUnique({ where: { email: leaderEmail } });

    if (!teacher || !leader) {
        console.error('❌ Teacher or Leader not found in user_service schema. Seed user-service first.');
        return;
    }

    await prisma.observation.create({
        data: {
            teacherId: teacher.id,
            observerId: leader.id,
            date: new Date(),
            domain: 'Classroom Management',
            score: 4.5,
            status: 'COMPLETED',
            domainRatings: {
                create: [
                    { domainId: 1, title: 'Environment', rating: 'Strong', evidence: 'Calm atmosphere' },
                    { domainId: 2, title: 'Behavior', rating: 'Consistent', evidence: 'Clear expectations' }
                ]
            }
        }
    });

    console.log('✅ Observation Service seeded successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
