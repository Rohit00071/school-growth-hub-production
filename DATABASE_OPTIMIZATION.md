# DATABASE OPTIMIZATION STRATEGY
## School Growth Hub - Scaling to 100,000 Users

**Phase:** 3 of 11  
**Focus:** Database architecture, indexing, sharding, and replication

---

## CURRENT DATABASE ANALYSIS

### Provider: Neon (Serverless PostgreSQL)
- **Connection:** Direct connection (no pooling)
- **Replication:** None
- **Sharding:** None
- **Indexes:** Minimal (only primary keys and unique constraints)

### Current Limitations
- ❌ Single point of failure
- ❌ No read scaling
- ❌ Limited connection pool (10-100 connections)
- ❌ No query optimization
- ❌ No caching layer

---

## TARGET ARCHITECTURE

### Multi-Tier Database Strategy

```
┌─────────────────────────────────────────────────┐
│              Application Layer                   │
│  (User Service, Observation Service, etc.)      │
└────────┬────────────────────────────────────────┘
         │
    ┌────▼────────────────────────────────┐
    │      Connection Pooler (PgBouncer)   │
    │      Max 10,000 connections          │
    └────┬────────────────────────────────┘
         │
    ┌────▼─────────────────────────────────┐
    │         Primary Database              │
    │    (Handles ALL writes)               │
    │    PostgreSQL 15+                     │
    └────┬─────────────────────────────────┘
         │
         │ (Streaming Replication)
         │
    ┌────┴──────┬──────────┬──────────┬──────────┐
    │           │          │          │          │
┌───▼──┐   ┌───▼──┐   ┌───▼──┐   ┌───▼──┐   ┌───▼──┐
│Read  │   │Read  │   │Read  │   │Read  │   │Read  │
│Replica│  │Replica│  │Replica│  │Replica│  │Replica│
│  1   │   │  2   │   │  3   │   │  4   │   │  5   │
└──────┘   └──────┘   └──────┘   └──────┘   └──────┘
```

---

## INDEXING STRATEGY

### Critical Indexes to Add

#### User Service Database

```sql
-- ============================================
-- USER TABLE INDEXES
-- ============================================

-- Email lookup (login, registration check)
CREATE UNIQUE INDEX idx_users_email 
ON "User"(email) 
WHERE "isActive" = true;

-- Role-based queries (list all teachers)
CREATE INDEX idx_users_role 
ON "User"(role) 
WHERE "isActive" = true;

-- Campus-based queries (list teachers by campus)
CREATE INDEX idx_users_campus_role 
ON "User"("campusId", role) 
WHERE "campusId" IS NOT NULL AND "isActive" = true;

-- Department queries
CREATE INDEX idx_users_department 
ON "User"(department) 
WHERE department IS NOT NULL;

-- Active user queries
CREATE INDEX idx_users_active_created 
ON "User"("isActive", "createdAt" DESC);

-- Covering index for user list queries
CREATE INDEX idx_users_list_covering 
ON "User"(id, email, "fullName", role, "campusId", department) 
INCLUDE ("avatarUrl", "createdAt") 
WHERE "isActive" = true;

-- ============================================
-- USER SESSION TABLE INDEXES
-- ============================================

CREATE UNIQUE INDEX idx_sessions_token 
ON "UserSession"(token);

CREATE UNIQUE INDEX idx_sessions_refresh_token 
ON "UserSession"("refreshToken");

CREATE INDEX idx_sessions_user_active 
ON "UserSession"("userId", "expiresAt") 
WHERE "expiresAt" > NOW();

-- Cleanup expired sessions
CREATE INDEX idx_sessions_expired 
ON "UserSession"("expiresAt") 
WHERE "expiresAt" < NOW();
```

#### Observation Service Database

```sql
-- ============================================
-- OBSERVATION TABLE INDEXES
-- ============================================

-- Teacher's observations (most common query)
CREATE INDEX idx_observations_teacher_date 
ON "Observation"("teacherId", date DESC);

-- Observer's observations
CREATE INDEX idx_observations_observer_date 
ON "Observation"("observerId", date DESC);

-- Status-based queries
CREATE INDEX idx_observations_status 
ON "Observation"(status);

-- Teacher + Status (filtered queries)
CREATE INDEX idx_observations_teacher_status 
ON "Observation"("teacherId", status, date DESC);

-- Date range queries
CREATE INDEX idx_observations_date_range 
ON "Observation"(date DESC);

-- Covering index for observation list
CREATE INDEX idx_observations_list_covering 
ON "Observation"("teacherId", date DESC) 
INCLUDE (id, "observerId", domain, score, status, "createdAt");

-- Analytics queries
CREATE INDEX idx_observations_teacher_domain 
ON "Observation"("teacherId", domain, date DESC);

-- ============================================
-- OBSERVATION DOMAIN TABLE INDEXES
-- ============================================

CREATE INDEX idx_observation_domains_observation 
ON "ObservationDomain"("observationId");

CREATE INDEX idx_observation_domains_domain 
ON "ObservationDomain"("domainId", rating);
```

#### Goal Service Database

```sql
-- ============================================
-- GOAL TABLE INDEXES
-- ============================================

-- Teacher's goals
CREATE INDEX idx_goals_teacher_status 
ON "Goal"("teacherId", status);

-- Due date queries
CREATE INDEX idx_goals_due_date 
ON "Goal"("dueDate") 
WHERE status IN ('IN_PROGRESS', 'NEAR_COMPLETION');

-- School-aligned goals
CREATE INDEX idx_goals_school_aligned 
ON "Goal"("isSchoolAligned", status) 
WHERE "isSchoolAligned" = true;

-- Category-based queries
CREATE INDEX idx_goals_category 
ON "Goal"(category, status) 
WHERE category IS NOT NULL;

-- Covering index for goal list
CREATE INDEX idx_goals_list_covering 
ON "Goal"("teacherId", status) 
INCLUDE (id, title, progress, "dueDate", "createdAt");
```

#### Document Service Database

```sql
-- ============================================
-- DOCUMENT TABLE INDEXES
-- ============================================

CREATE INDEX idx_documents_created_by 
ON "Document"("createdById", "createdAt" DESC);

CREATE INDEX idx_documents_created_date 
ON "Document"("createdAt" DESC);

CREATE INDEX idx_documents_signature_required 
ON "Document"("requiresSignature") 
WHERE "requiresSignature" = true;

-- ============================================
-- DOCUMENT ACKNOWLEDGEMENT TABLE INDEXES
-- ============================================

-- Teacher's acknowledgements (most common)
CREATE INDEX idx_ack_teacher_status 
ON "DocumentAcknowledgement"("teacherId", status);

-- Document's acknowledgements
CREATE INDEX idx_ack_document_status 
ON "DocumentAcknowledgement"("documentId", status);

-- Pending acknowledgements
CREATE INDEX idx_ack_pending 
ON "DocumentAcknowledgement"(status, "createdAt") 
WHERE status = 'PENDING';

-- Recently acknowledged
CREATE INDEX idx_ack_recent 
ON "DocumentAcknowledgement"("acknowledgedAt" DESC) 
WHERE "acknowledgedAt" IS NOT NULL;

-- Covering index for acknowledgement list
CREATE INDEX idx_ack_list_covering 
ON "DocumentAcknowledgement"("teacherId", status) 
INCLUDE (id, "documentId", "viewedAt", "acknowledgedAt", "createdAt");
```

### Index Maintenance

```sql
-- Analyze tables to update statistics
ANALYZE "User";
ANALYZE "Observation";
ANALYZE "Goal";
ANALYZE "Document";
ANALYZE "DocumentAcknowledgement";

-- Reindex to rebuild indexes (monthly maintenance)
REINDEX TABLE "User";
REINDEX TABLE "Observation";

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Find unused indexes (candidates for removal)
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## CONNECTION POOLING

### PgBouncer Configuration

```ini
# pgbouncer.ini

[databases]
user_db = host=user-db-primary.internal port=5432 dbname=user_db
observation_db = host=observation-db-primary.internal port=5432 dbname=observation_db
goal_db = host=goal-db-primary.internal port=5432 dbname=goal_db
document_db = host=document-db-primary.internal port=5432 dbname=document_db

[pgbouncer]
# Connection pool mode
pool_mode = transaction

# Maximum connections
max_client_conn = 10000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3

# Server connections
max_db_connections = 100
max_user_connections = 100

# Timeouts
server_idle_timeout = 600
server_lifetime = 3600
server_connect_timeout = 15
query_timeout = 30

# Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1

# Performance
server_reset_query = DISCARD ALL
server_check_delay = 30
```

### Prisma Connection Configuration

```typescript
// prisma.config.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' }
  ]
});

// Log slow queries
prisma.$on('query', (e) => {
  if (e.duration > 100) {
    console.warn(`Slow query (${e.duration}ms): ${e.query}`);
  }
});

// Connection pool settings via DATABASE_URL
// postgresql://user:password@pgbouncer:6432/dbname?
//   connection_limit=20&
//   pool_timeout=10&
//   connect_timeout=10

export default prisma;
```

---

## READ REPLICA STRATEGY

### Load Balancing Reads

```typescript
// database/replicaManager.ts

class DatabaseReplicaManager {
  private primary: PrismaClient;
  private replicas: PrismaClient[];
  private currentReplicaIndex = 0;

  constructor() {
    // Primary database (writes only)
    this.primary = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_PRIMARY_URL }
      }
    });

    // Read replicas
    this.replicas = [
      new PrismaClient({
        datasources: {
          db: { url: process.env.DATABASE_REPLICA_1_URL }
        }
      }),
      new PrismaClient({
        datasources: {
          db: { url: process.env.DATABASE_REPLICA_2_URL }
        }
      }),
      new PrismaClient({
        datasources: {
          db: { url: process.env.DATABASE_REPLICA_3_URL }
        }
      }),
      new PrismaClient({
        datasources: {
          db: { url: process.env.DATABASE_REPLICA_4_URL }
        }
      }),
      new PrismaClient({
        datasources: {
          db: { url: process.env.DATABASE_REPLICA_5_URL }
        }
      })
    ];
  }

  /**
   * Get primary database for writes
   */
  getPrimary(): PrismaClient {
    return this.primary;
  }

  /**
   * Get read replica (round-robin load balancing)
   */
  getReplica(): PrismaClient {
    const replica = this.replicas[this.currentReplicaIndex];
    this.currentReplicaIndex = (this.currentReplicaIndex + 1) % this.replicas.length;
    return replica;
  }

  /**
   * Execute write operation
   */
  async write<T>(operation: (db: PrismaClient) => Promise<T>): Promise<T> {
    return operation(this.primary);
  }

  /**
   * Execute read operation
   */
  async read<T>(operation: (db: PrismaClient) => Promise<T>): Promise<T> {
    return operation(this.getReplica());
  }
}

export const db = new DatabaseReplicaManager();
```

### Usage in Repository

```typescript
// observationRepository.ts

export class ObservationRepository {
  /**
   * Get observation by ID (read from replica)
   */
  async findById(id: string): Promise<Observation | null> {
    return db.read(async (prisma) => {
      return prisma.observation.findUnique({
        where: { id },
        include: {
          domainRatings: true
        }
      });
    });
  }

  /**
   * Create observation (write to primary)
   */
  async create(data: CreateObservationDto): Promise<Observation> {
    return db.write(async (prisma) => {
      return prisma.observation.create({
        data,
        include: {
          domainRatings: true
        }
      });
    });
  }

  /**
   * Get teacher's observations (read from replica)
   */
  async findByTeacher(
    teacherId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ observations: Observation[]; total: number }> {
    return db.read(async (prisma) => {
      const [observations, total] = await Promise.all([
        prisma.observation.findMany({
          where: { teacherId },
          orderBy: { date: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            teacherId: true,
            observerId: true,
            date: true,
            domain: true,
            score: true,
            status: true,
            createdAt: true
          }
        }),
        prisma.observation.count({
          where: { teacherId }
        })
      ]);

      return { observations, total };
    });
  }
}
```

---

## QUERY OPTIMIZATION

### Field Selection (Avoid Over-fetching)

```typescript
// ❌ BAD: Fetches all fields
const user = await prisma.user.findUnique({
  where: { id: userId }
});
// Returns: id, email, password, fullName, avatarUrl, role, campusId, department, createdAt, updatedAt

// ✅ GOOD: Fetch only needed fields
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    fullName: true,
    role: true
  }
});
// Returns: id, email, fullName, role (50% smaller payload)
```

### Avoid N+1 Queries

```typescript
// ❌ BAD: N+1 query problem
const observations = await prisma.observation.findMany({
  where: { teacherId }
});

for (const obs of observations) {
  const teacher = await prisma.user.findUnique({
    where: { id: obs.teacherId }
  });
  const observer = await prisma.user.findUnique({
    where: { id: obs.observerId }
  });
}
// Makes 1 + (N * 2) queries!

// ✅ GOOD: Use include to join
const observations = await prisma.observation.findMany({
  where: { teacherId },
  include: {
    teacher: {
      select: { id: true, fullName: true, email: true }
    },
    observer: {
      select: { id: true, fullName: true, email: true }
    }
  }
});
// Makes only 1 query with JOIN
```

### Batch Queries

```typescript
// ❌ BAD: Multiple individual queries
const users = [];
for (const id of userIds) {
  const user = await prisma.user.findUnique({ where: { id } });
  users.push(user);
}

// ✅ GOOD: Single batch query
const users = await prisma.user.findMany({
  where: {
    id: { in: userIds }
  }
});
```

### Pagination Best Practices

```typescript
// ❌ BAD: Offset pagination (slow for large offsets)
const observations = await prisma.observation.findMany({
  skip: (page - 1) * limit,  // Slow when page = 1000
  take: limit,
  orderBy: { createdAt: 'desc' }
});

// ✅ GOOD: Cursor-based pagination (fast for any page)
const observations = await prisma.observation.findMany({
  take: limit,
  cursor: lastSeenId ? { id: lastSeenId } : undefined,
  orderBy: { createdAt: 'desc' }
});
```

---

## DENORMALIZATION STRATEGY

### When to Denormalize

**Denormalize when:**
- ✅ Data is read frequently (90%+ reads)
- ✅ Data changes rarely
- ✅ JOIN performance is critical
- ✅ Data is immutable (historical snapshot)

**Don't denormalize when:**
- ❌ Data changes frequently
- ❌ Consistency is critical
- ❌ Storage cost is high

### Example: Denormalize User Info in Observations

```prisma
model Observation {
  id                String   @id @default(uuid())
  teacherId         String
  observerId        String
  
  // DENORMALIZED FIELDS (snapshot at creation time)
  teacherName       String   // Copied from User.fullName
  teacherEmail      String   // Copied from User.email
  observerName      String   // Copied from User.fullName
  observerEmail     String   // Copied from User.email
  
  date              DateTime
  domain            String
  score             Float
  notes             String?  @db.Text
  status            ObservationStatus
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations (still keep for updates)
  teacher           User     @relation("Teacher", fields: [teacherId], references: [id])
  observer          User     @relation("Observer", fields: [observerId], references: [id])
}
```

**Benefits:**
- No JOIN needed to display observation list
- Preserves historical data (even if user changes name)
- 50% faster queries

**Trade-offs:**
- Larger storage (extra 200 bytes per observation)
- Must keep denormalized data in sync

### Sync Strategy

```typescript
// When user updates profile, update denormalized data
async function updateUserProfile(userId: string, updates: any) {
  await db.write(async (prisma) => {
    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updates
    });

    // Update denormalized data in observations
    if (updates.fullName || updates.email) {
      await prisma.observation.updateMany({
        where: { teacherId: userId },
        data: {
          teacherName: updates.fullName,
          teacherEmail: updates.email
        }
      });

      await prisma.observation.updateMany({
        where: { observerId: userId },
        data: {
          observerName: updates.fullName,
          observerEmail: updates.email
        }
      });
    }

    return user;
  });
}
```

---

## SHARDING STRATEGY (Future: 500K+ Users)

### Shard by Campus/School

```
Shard 1: Campus A, B, C (30K users)
Shard 2: Campus D, E, F (30K users)
Shard 3: Campus G, H, I (30K users)
Shard 4: Campus J, K, L (30K users)
```

### Shard Routing

```typescript
class ShardRouter {
  private shards: Map<string, PrismaClient>;

  constructor() {
    this.shards = new Map([
      ['shard1', new PrismaClient({ datasources: { db: { url: process.env.SHARD_1_URL } } })],
      ['shard2', new PrismaClient({ datasources: { db: { url: process.env.SHARD_2_URL } } })],
      ['shard3', new PrismaClient({ datasources: { db: { url: process.env.SHARD_3_URL } } })],
      ['shard4', new PrismaClient({ datasources: { db: { url: process.env.SHARD_4_URL } } })]
    ]);
  }

  getShardForCampus(campusId: string): PrismaClient {
    const shardId = this.calculateShard(campusId);
    return this.shards.get(shardId)!;
  }

  private calculateShard(campusId: string): string {
    const hash = this.hashString(campusId);
    const shardNumber = (hash % 4) + 1;
    return `shard${shardNumber}`;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
```

---

## BACKUP & DISASTER RECOVERY

### Backup Strategy

```bash
# Automated daily backups
0 2 * * * pg_dump -h primary-db -U postgres -d user_db | gzip > /backups/user_db_$(date +\%Y\%m\%d).sql.gz

# Continuous WAL archiving
archive_mode = on
archive_command = 'cp %p /archive/%f'
wal_level = replica
```

### Point-in-Time Recovery

```bash
# Restore to specific point in time
pg_restore -h restored-db -U postgres -d user_db /backups/user_db_20260210.sql.gz

# Apply WAL logs up to specific time
recovery_target_time = '2026-02-10 14:30:00'
```

### Disaster Recovery Plan

1. **Automated Failover:** Promote read replica to primary (< 2 minutes)
2. **Cross-Region Backup:** Daily backups to different region
3. **Monthly DR Drill:** Test full recovery procedure
4. **RTO Target:** < 4 hours
5. **RPO Target:** < 15 minutes

---

## MONITORING & ALERTS

### Key Metrics to Monitor

```sql
-- Connection pool usage
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';

-- Slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Table bloat
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

### Alerts

- ⚠️ Connection pool > 80% → Scale up
- ⚠️ Query latency P95 > 100ms → Investigate
- ⚠️ Replication lag > 5 seconds → Check network
- 🔴 Primary database down → Failover to replica
- 🔴 Disk usage > 85% → Expand storage

---

## PERFORMANCE TARGETS

### Query Performance Goals

| Query Type | Target P95 | Target P99 |
|-----------|-----------|-----------|
| User by ID | < 5ms | < 10ms |
| User by email | < 10ms | < 20ms |
| Observation list (paginated) | < 50ms | < 100ms |
| Observation by ID | < 10ms | < 20ms |
| Goal list | < 30ms | < 60ms |
| Document acknowledgements | < 40ms | < 80ms |

### Database Capacity

- **Connections:** 10,000 concurrent (via PgBouncer)
- **Queries per second:** 50,000 reads, 5,000 writes
- **Storage:** 500 GB (with room to grow to 2 TB)
- **Replication lag:** < 1 second (P99)

---

## NEXT PHASE

Continue to **CACHING_STRATEGY.md** for multi-layer caching architecture.
