import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const indexes = [
    // User indexes
    `CREATE INDEX IF NOT EXISTS idx_users_email ON "User"(email) WHERE "isActive" = true`,
    `CREATE INDEX IF NOT EXISTS idx_users_role ON "User"(role)`,
    `CREATE INDEX IF NOT EXISTS idx_users_campus_role ON "User"("campusId", role) WHERE "campusId" IS NOT NULL`,
    `CREATE INDEX IF NOT EXISTS idx_users_department ON "User"(department) WHERE department IS NOT NULL`,

    // Observation indexes
    `CREATE INDEX IF NOT EXISTS idx_observations_teacher_date ON "Observation"("teacherId", date DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_observations_observer_date ON "Observation"("observerId", date DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_observations_status ON "Observation"(status)`,
    `CREATE INDEX IF NOT EXISTS idx_observations_teacher_status ON "Observation"("teacherId", status, date DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_observations_date ON "Observation"(date DESC)`,

    // Observation Domain indexes
    `CREATE INDEX IF NOT EXISTS idx_observation_domains_observation ON "ObservationDomain"("observationId")`,

    // Goal indexes
    `CREATE INDEX IF NOT EXISTS idx_goals_teacher_status ON "Goal"("teacherId", status)`,
    `CREATE INDEX IF NOT EXISTS idx_goals_due_date ON "Goal"("dueDate") WHERE status IN ('IN_PROGRESS', 'NEAR_COMPLETION')`,
    `CREATE INDEX IF NOT EXISTS idx_goals_school_aligned ON "Goal"("isSchoolAligned", status) WHERE "isSchoolAligned" = true`,
    `CREATE INDEX IF NOT EXISTS idx_goals_category ON "Goal"(category, status) WHERE category IS NOT NULL`,

    // Document indexes
    `CREATE INDEX IF NOT EXISTS idx_documents_created_by ON "Document"("createdById", "createdAt" DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_documents_created_date ON "Document"("createdAt" DESC)`,

    // Document Acknowledgement indexes
    `CREATE INDEX IF NOT EXISTS idx_ack_teacher_status ON "DocumentAcknowledgement"("teacherId", status)`,
    `CREATE INDEX IF NOT EXISTS idx_ack_document_status ON "DocumentAcknowledgement"("documentId", status)`,
    `CREATE INDEX IF NOT EXISTS idx_ack_pending ON "DocumentAcknowledgement"(status, "createdAt") WHERE status = 'PENDING'`,
    `CREATE INDEX IF NOT EXISTS idx_ack_recent ON "DocumentAcknowledgement"("acknowledgedAt" DESC) WHERE "acknowledgedAt" IS NOT NULL`,

    // Training Event indexes
    `CREATE INDEX IF NOT EXISTS idx_training_events_date ON "TrainingEvent"(date DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_training_events_status ON "TrainingEvent"(status)`,

    // Registration indexes
    `CREATE INDEX IF NOT EXISTS idx_registrations_user ON "Registration"("userId")`,
    `CREATE INDEX IF NOT EXISTS idx_registrations_event ON "Registration"("eventId")`,

    // PD Hours indexes
    `CREATE INDEX IF NOT EXISTS idx_pd_hours_user ON "PDHour"("userId", date DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_pd_hours_status ON "PDHour"(status)`,
];

async function applyIndexes() {
    console.log('🚀 Starting database optimization...');
    console.log('Expected impact: 10-100x faster queries\n');

    let successCount = 0;
    let errorCount = 0;

    for (const [index, sql] of indexes.entries()) {
        try {
            const indexName = sql.match(/idx_\w+/)?.[0] || `index_${index}`;
            process.stdout.write(`Creating ${indexName}... `);

            await prisma.$executeRawUnsafe(sql);

            console.log('✅');
            successCount++;
        } catch (error: any) {
            if (error.message.includes('already exists')) {
                console.log('⏭️  (already exists)');
                successCount++;
            } else {
                console.log('❌');
                console.error(`Error: ${error.message}`);
                errorCount++;
            }
        }
    }

    console.log('\n📊 Analyzing tables...');

    const tables = ['User', 'Observation', 'ObservationDomain', 'Goal', 'Document',
        'DocumentAcknowledgement', 'TrainingEvent', 'Registration', 'PDHour'];

    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`ANALYZE "${table}"`);
            console.log(`  ✅ ${table}`);
        } catch (error: any) {
            console.log(`  ⚠️  ${table}: ${error.message}`);
        }
    }

    console.log('\n✅ Database optimization complete!');
    console.log(`\nResults: ${successCount} indexes created, ${errorCount} errors\n`);

    console.log('Expected improvements:');
    console.log('  - User queries: 10-50x faster');
    console.log('  - Observation queries: 50-100x faster');
    console.log('  - Goal queries: 10-20x faster');
    console.log('  - Document queries: 10-30x faster\n');

    console.log('Next steps:');
    console.log('  1. Test query performance');
    console.log('  2. Monitor application logs');
    console.log('  3. Proceed to Step 2: Redis caching\n');
}

applyIndexes()
    .catch((error) => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
