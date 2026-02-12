-- ============================================
-- CRITICAL PERFORMANCE INDEXES
-- Expected Impact: 10-100x faster queries
-- Execution Time: 2-5 minutes
-- ============================================

-- ============================================
-- USER TABLE INDEXES
-- ============================================

-- Email lookup (login, registration check)
CREATE INDEX IF NOT EXISTS idx_users_email 
ON "User"(email) 
WHERE "isActive" = true;

-- Role-based queries (list all teachers)
CREATE INDEX IF NOT EXISTS idx_users_role 
ON "User"(role);

-- Campus-based queries (list teachers by campus)
CREATE INDEX IF NOT EXISTS idx_users_campus_role 
ON "User"("campusId", role) 
WHERE "campusId" IS NOT NULL;

-- Department queries
CREATE INDEX IF NOT EXISTS idx_users_department 
ON "User"(department) 
WHERE department IS NOT NULL;

-- ============================================
-- OBSERVATION TABLE INDEXES
-- ============================================

-- Teacher's observations (most common query)
CREATE INDEX IF NOT EXISTS idx_observations_teacher_date 
ON "Observation"("teacherId", date DESC);

-- Observer's observations
CREATE INDEX IF NOT EXISTS idx_observations_observer_date 
ON "Observation"("observerId", date DESC);

-- Status-based queries
CREATE INDEX IF NOT EXISTS idx_observations_status 
ON "Observation"(status);

-- Teacher + Status (filtered queries)
CREATE INDEX IF NOT EXISTS idx_observations_teacher_status 
ON "Observation"("teacherId", status, date DESC);

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_observations_date 
ON "Observation"(date DESC);

-- ============================================
-- OBSERVATION DOMAIN TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_observation_domains_observation 
ON "ObservationDomain"("observationId");

-- ============================================
-- GOAL TABLE INDEXES
-- ============================================

-- Teacher's goals
CREATE INDEX IF NOT EXISTS idx_goals_teacher_status 
ON "Goal"("teacherId", status);

-- Due date queries
CREATE INDEX IF NOT EXISTS idx_goals_due_date 
ON "Goal"("dueDate") 
WHERE status IN ('IN_PROGRESS', 'NEAR_COMPLETION');

-- School-aligned goals
CREATE INDEX IF NOT EXISTS idx_goals_school_aligned 
ON "Goal"("isSchoolAligned", status) 
WHERE "isSchoolAligned" = true;

-- Category-based queries
CREATE INDEX IF NOT EXISTS idx_goals_category 
ON "Goal"(category, status) 
WHERE category IS NOT NULL;

-- ============================================
-- DOCUMENT TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_documents_created_by 
ON "Document"("createdById", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_documents_created_date 
ON "Document"("createdAt" DESC);

-- ============================================
-- DOCUMENT ACKNOWLEDGEMENT TABLE INDEXES
-- ============================================

-- Teacher's acknowledgements (most common)
CREATE INDEX IF NOT EXISTS idx_ack_teacher_status 
ON "DocumentAcknowledgement"("teacherId", status);

-- Document's acknowledgements
CREATE INDEX IF NOT EXISTS idx_ack_document_status 
ON "DocumentAcknowledgement"("documentId", status);

-- Pending acknowledgements
CREATE INDEX IF NOT EXISTS idx_ack_pending 
ON "DocumentAcknowledgement"(status, "createdAt") 
WHERE status = 'PENDING';

-- Recently acknowledged
CREATE INDEX IF NOT EXISTS idx_ack_recent 
ON "DocumentAcknowledgement"("acknowledgedAt" DESC) 
WHERE "acknowledgedAt" IS NOT NULL;

-- ============================================
-- TRAINING EVENT TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_training_events_date 
ON "TrainingEvent"(date DESC);

CREATE INDEX IF NOT EXISTS idx_training_events_status 
ON "TrainingEvent"(status);

-- ============================================
-- REGISTRATION TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_registrations_user 
ON "Registration"("userId");

CREATE INDEX IF NOT EXISTS idx_registrations_event 
ON "Registration"("eventId");

-- ============================================
-- PD HOURS TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pd_hours_user 
ON "PDHour"("userId", date DESC);

CREATE INDEX IF NOT EXISTS idx_pd_hours_status 
ON "PDHour"(status);

-- ============================================
-- ANALYZE TABLES (Update Statistics)
-- ============================================

ANALYZE "User";
ANALYZE "Observation";
ANALYZE "ObservationDomain";
ANALYZE "Goal";
ANALYZE "Document";
ANALYZE "DocumentAcknowledgement";
ANALYZE "TrainingEvent";
ANALYZE "Registration";
ANALYZE "PDHour";

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check indexes created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
