# MICROSERVICES ARCHITECTURE DESIGN
## School Growth Hub - Domain-Driven Service Decomposition

**Phase:** 2 of 11  
**Target:** 100,000+ concurrent users  
**Architecture Pattern:** Event-Driven Microservices

---

## SERVICE DECOMPOSITION STRATEGY

### Core Principles

1. **Domain-Driven Design (DDD):** Each service owns a bounded context
2. **Database Per Service:** No shared databases between services
3. **Async Communication:** Event-driven, no synchronous calls
4. **Independent Deployment:** Each service can be deployed separately
5. **Autonomous Scaling:** Scale services based on individual load

---

## SERVICE CATALOG

### 1. API GATEWAY SERVICE

**Purpose:** Single entry point for all client requests

**Responsibilities:**
- Route requests to appropriate services
- Authentication and authorization
- Rate limiting (per user, per IP)
- Request/response logging
- Response caching
- Request transformation
- Circuit breaking

**Technology Stack:**
```
- Kong Gateway / AWS API Gateway / Custom Express Gateway
- Redis for rate limiting
- JWT validation
- Request ID generation
```

**Endpoints:**
```
ALL /api/v1/* → Route to appropriate service
GET /health → Gateway health check
GET /metrics → Prometheus metrics
```

**Configuration:**
```yaml
# kong.yml
services:
  - name: user-service
    url: http://user-service:3001
    routes:
      - paths: ["/api/v1/users", "/api/v1/auth"]
    plugins:
      - name: rate-limiting
        config:
          minute: 100
          hour: 1000
      - name: jwt
      - name: cors

  - name: observation-service
    url: http://observation-service:3002
    routes:
      - paths: ["/api/v1/observations"]
    plugins:
      - name: rate-limiting
        config:
          minute: 200
          hour: 2000
```

**Scaling:**
- Replicas: 3-5 instances
- Auto-scale based on request rate
- Target: 10,000 req/sec per instance

---

### 2. USER SERVICE

**Purpose:** Manage user accounts, authentication, and authorization

**Responsibilities:**
- User registration and profile management
- Authentication (login, logout, token refresh)
- Authorization (role and permission management)
- User preferences and settings
- Password reset and email verification

**Database Schema:**
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String    // Bcrypt hashed
  fullName      String
  avatarUrl     String?
  role          Role      @default(TEACHER)
  campusId      String?
  department    String?
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([email])
  @@index([role])
  @@index([campusId])
}

model UserSession {
  id           String   @id @default(uuid())
  userId       String
  token        String   @unique
  refreshToken String   @unique
  expiresAt    DateTime
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())
  
  @@index([userId])
  @@index([token])
}
```

**API Endpoints:**
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

GET    /api/v1/users?page=1&limit=50&role=TEACHER
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id

GET    /api/v1/users/me
PATCH  /api/v1/users/me/profile
PATCH  /api/v1/users/me/password
```

**Events Published:**
```
user.registered     → { userId, email, fullName, role }
user.updated        → { userId, changes }
user.deleted        → { userId }
user.login          → { userId, timestamp, ipAddress }
user.logout         → { userId, timestamp }
```

**Events Consumed:**
```
None (User service is foundational)
```

**Caching Strategy:**
```typescript
// Cache user profile for 1 hour
const cacheKey = `user:${userId}:profile`;
await redis.setex(cacheKey, 3600, JSON.stringify(user));

// Cache user permissions for 30 minutes
const permKey = `user:${userId}:permissions`;
await redis.setex(permKey, 1800, JSON.stringify(permissions));
```

**Scaling:**
- Replicas: 5-10 instances
- Database: Primary + 3 read replicas
- Cache: Redis cluster
- Target: 1,000 req/sec

---

### 3. OBSERVATION SERVICE

**Purpose:** Manage classroom observations and feedback

**Responsibilities:**
- Create, read, update observations
- Domain ratings management
- Observation status workflow
- Teacher reflections
- Observer feedback

**Database Schema:**
```prisma
model Observation {
  id                String            @id @default(uuid())
  teacherId         String
  observerId        String
  date              DateTime
  domain            String
  score             Float
  notes             String?           @db.Text
  status            ObservationStatus @default(SUBMITTED)
  actionStep        String?           @db.Text
  teacherReflection String?           @db.Text
  discussionMet     Boolean           @default(false)
  hasReflection     Boolean           @default(false)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  domainRatings     ObservationDomain[]
  
  @@index([teacherId, date])
  @@index([observerId, date])
  @@index([status])
  @@index([teacherId, status])
}

model ObservationDomain {
  id             String      @id @default(uuid())
  observationId  String
  domainId       Int
  title          String
  rating         String
  evidence       String?     @db.Text
  
  @@index([observationId])
}
```

**API Endpoints:**
```
GET    /api/v1/observations?teacherId=xxx&page=1&limit=50
GET    /api/v1/observations?observerId=xxx&page=1&limit=50
GET    /api/v1/observations/:id
POST   /api/v1/observations
PATCH  /api/v1/observations/:id
DELETE /api/v1/observations/:id

PATCH  /api/v1/observations/:id/reflection
PATCH  /api/v1/observations/:id/status
GET    /api/v1/observations/stats?teacherId=xxx
```

**Events Published:**
```
observation.created        → { observationId, teacherId, observerId }
observation.updated        → { observationId, changes }
observation.submitted      → { observationId, teacherId }
observation.reflection_added → { observationId, teacherId }
```

**Events Consumed:**
```
user.deleted → Delete all observations for user
```

**Caching Strategy:**
```typescript
// Cache observation details for 10 minutes
const cacheKey = `observation:${observationId}`;
await redis.setex(cacheKey, 600, JSON.stringify(observation));

// Cache teacher's observations list for 5 minutes
const listKey = `observations:teacher:${teacherId}:page:${page}`;
await redis.setex(listKey, 300, JSON.stringify(observations));
```

**Scaling:**
- Replicas: 5-10 instances
- Database: Primary + 5 read replicas (read-heavy)
- Cache: Redis cluster
- Target: 2,000 req/sec

---

### 4. GOAL SERVICE

**Purpose:** Manage teacher professional development goals

**Responsibilities:**
- Goal creation and tracking
- Progress updates
- Goal status management
- School-aligned goals
- Goal analytics

**Database Schema:**
```prisma
model Goal {
  id                String     @id @default(uuid())
  teacherId         String
  title             String
  description       String?    @db.Text
  progress          Int        @default(0)
  dueDate           DateTime
  status            GoalStatus @default(IN_PROGRESS)
  isSchoolAligned   Boolean    @default(false)
  category          String?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  
  @@index([teacherId])
  @@index([status])
  @@index([dueDate])
  @@index([teacherId, status])
}
```

**API Endpoints:**
```
GET    /api/v1/goals?teacherId=xxx&page=1&limit=50
GET    /api/v1/goals/:id
POST   /api/v1/goals
PATCH  /api/v1/goals/:id
PATCH  /api/v1/goals/:id/progress
DELETE /api/v1/goals/:id

GET    /api/v1/goals/stats?teacherId=xxx
```

**Events Published:**
```
goal.created         → { goalId, teacherId }
goal.updated         → { goalId, changes }
goal.completed       → { goalId, teacherId }
goal.progress_updated → { goalId, progress }
```

**Events Consumed:**
```
user.deleted → Delete all goals for user
```

**Scaling:**
- Replicas: 3-5 instances
- Database: Primary + 2 read replicas
- Target: 500 req/sec

---

### 5. DOCUMENT SERVICE

**Purpose:** Manage documents and acknowledgements

**Responsibilities:**
- Document upload and storage
- Document metadata management
- Acknowledgement tracking
- Digital signatures
- Document versioning

**Database Schema:**
```prisma
model Document {
  id                String   @id @default(uuid())
  title             String
  description       String?  @db.Text
  fileUrl           String
  fileName          String
  fileSize          Int?
  version           String   @default("1.0")
  requiresSignature Boolean  @default(false)
  createdById       String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  hash              String?  // SHA256
  
  acknowledgements  DocumentAcknowledgement[]
  
  @@index([createdById])
  @@index([createdAt])
}

model DocumentAcknowledgement {
  id              String                @id @default(uuid())
  documentId      String
  teacherId       String
  status          AcknowledgementStatus @default(PENDING)
  viewedAt        DateTime?
  acknowledgedAt  DateTime?
  signatureUrl    String?
  ipAddress       String?
  userAgent       String?              @db.Text
  receiptUrl      String?
  documentHash    String?
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
  
  @@unique([documentId, teacherId])
  @@index([teacherId])
  @@index([documentId])
  @@index([status])
}
```

**API Endpoints:**
```
GET    /api/v1/documents?page=1&limit=50
GET    /api/v1/documents/:id
POST   /api/v1/documents
PATCH  /api/v1/documents/:id
DELETE /api/v1/documents/:id

GET    /api/v1/documents/:id/acknowledgements
POST   /api/v1/documents/:id/acknowledge
POST   /api/v1/documents/:id/sign

GET    /api/v1/acknowledgements?teacherId=xxx
```

**Events Published:**
```
document.created      → { documentId, createdById }
document.updated      → { documentId, changes }
document.deleted      → { documentId }
document.viewed       → { documentId, teacherId }
document.acknowledged → { documentId, teacherId }
document.signed       → { documentId, teacherId }
```

**Events Consumed:**
```
user.deleted → Delete acknowledgements for user
```

**File Storage:**
- AWS S3 / Azure Blob Storage
- CDN for file delivery
- Signed URLs for secure access

**Scaling:**
- Replicas: 3-5 instances
- Database: Primary + 2 read replicas
- File storage: S3 with CloudFront CDN
- Target: 300 req/sec

---

### 6. NOTIFICATION SERVICE

**Purpose:** Send notifications via multiple channels

**Responsibilities:**
- Email notifications
- In-app notifications
- Push notifications (future)
- SMS notifications (future)
- Notification templates
- Delivery tracking

**Database Schema:**
```prisma
model Notification {
  id          String   @id @default(uuid())
  userId      String
  type        String   // email, in-app, push, sms
  channel     String   // observation, goal, document
  title       String
  message     String   @db.Text
  data        Json?    // Additional payload
  read        Boolean  @default(false)
  sentAt      DateTime?
  readAt      DateTime?
  createdAt   DateTime @default(now())
  
  @@index([userId, read])
  @@index([createdAt])
}

model EmailQueue {
  id          String   @id @default(uuid())
  to          String
  subject     String
  body        String   @db.Text
  template    String?
  data        Json?
  status      String   @default("pending") // pending, sent, failed
  attempts    Int      @default(0)
  lastError   String?  @db.Text
  sentAt      DateTime?
  createdAt   DateTime @default(now())
  
  @@index([status])
  @@index([createdAt])
}
```

**API Endpoints:**
```
GET    /api/v1/notifications?userId=xxx&page=1&limit=50
GET    /api/v1/notifications/:id
PATCH  /api/v1/notifications/:id/read
PATCH  /api/v1/notifications/mark-all-read
DELETE /api/v1/notifications/:id
```

**Events Consumed:**
```
observation.created → Send notification to teacher
observation.submitted → Send notification to observer
goal.completed → Send congratulations email
document.created → Send notification to all teachers
user.registered → Send welcome email
```

**Background Jobs:**
```typescript
// Email queue processor
async function processEmailQueue() {
  const emails = await prisma.emailQueue.findMany({
    where: { status: 'pending' },
    take: 100
  });
  
  for (const email of emails) {
    try {
      await sendEmail(email);
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: { status: 'sent', sentAt: new Date() }
      });
    } catch (error) {
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: { 
          status: 'failed',
          attempts: email.attempts + 1,
          lastError: error.message
        }
      });
    }
  }
}
```

**Scaling:**
- Replicas: 3-5 instances
- Background workers: 5-10 workers
- Email provider: SendGrid / AWS SES
- Target: 1,000 emails/min

---

### 7. ANALYTICS SERVICE

**Purpose:** Collect and analyze application metrics

**Responsibilities:**
- Event collection
- Metrics aggregation
- Report generation
- Dashboard data
- Trend analysis

**Database Schema:**
```prisma
model Event {
  id          String   @id @default(uuid())
  userId      String?
  eventType   String
  eventName   String
  properties  Json?
  timestamp   DateTime @default(now())
  
  @@index([userId, timestamp])
  @@index([eventType, timestamp])
  @@index([timestamp])
}

model MetricSnapshot {
  id          String   @id @default(uuid())
  metric      String
  value       Float
  dimensions  Json?
  timestamp   DateTime @default(now())
  
  @@index([metric, timestamp])
}
```

**API Endpoints:**
```
POST   /api/v1/analytics/events
GET    /api/v1/analytics/dashboard?userId=xxx
GET    /api/v1/analytics/observations/trends
GET    /api/v1/analytics/goals/completion-rate
GET    /api/v1/analytics/reports/generate
```

**Events Consumed:**
```
All events from all services
```

**Scaling:**
- Replicas: 2-3 instances
- Database: TimescaleDB / ClickHouse (optimized for time-series)
- Background workers: 3-5 workers
- Target: 10,000 events/sec

---

### 8. SEARCH SERVICE

**Purpose:** Provide fast full-text search

**Responsibilities:**
- Index observations, goals, documents
- Full-text search
- Faceted search
- Search suggestions
- Search analytics

**Technology:**
- Elasticsearch / Algolia
- Index all searchable content
- Real-time indexing via events

**API Endpoints:**
```
GET    /api/v1/search?q=classroom+management&type=observation
GET    /api/v1/search/suggest?q=class
GET    /api/v1/search/facets?type=observation
```

**Events Consumed:**
```
observation.created → Index observation
observation.updated → Update index
observation.deleted → Remove from index
goal.created → Index goal
document.created → Index document
```

**Scaling:**
- Elasticsearch cluster: 3-5 nodes
- Target: 500 searches/sec

---

### 9. FILE SERVICE

**Purpose:** Handle file uploads and processing

**Responsibilities:**
- File upload (images, PDFs, documents)
- Image resizing and optimization
- File virus scanning
- CDN integration
- File metadata management

**Technology:**
- AWS S3 / Azure Blob Storage
- Sharp for image processing
- ClamAV for virus scanning
- CloudFront / Cloudflare CDN

**API Endpoints:**
```
POST   /api/v1/files/upload
GET    /api/v1/files/:id
DELETE /api/v1/files/:id
GET    /api/v1/files/:id/download
```

**Scaling:**
- Replicas: 3-5 instances
- Storage: S3 with lifecycle policies
- CDN: CloudFront
- Target: 100 uploads/sec

---

### 10. BACKGROUND JOB SERVICE

**Purpose:** Process async tasks

**Responsibilities:**
- Report generation
- Data exports
- Bulk operations
- Scheduled tasks
- Cleanup jobs

**Technology:**
- BullMQ (Redis-based job queue)
- Worker processes
- Job monitoring dashboard

**Job Types:**
```typescript
// Report generation
interface GenerateReportJob {
  type: 'generate_report';
  userId: string;
  reportType: 'observations' | 'goals' | 'analytics';
  filters: any;
}

// Bulk import
interface BulkImportJob {
  type: 'bulk_import';
  fileUrl: string;
  importType: 'users' | 'observations';
}

// Cleanup
interface CleanupJob {
  type: 'cleanup';
  target: 'old_notifications' | 'expired_sessions';
}
```

**Scaling:**
- Workers: 10-20 worker processes
- Job queue: Redis cluster
- Target: 1,000 jobs/min

---

## SERVICE COMMUNICATION

### Event-Driven Architecture

**Message Broker:** RabbitMQ / Apache Kafka / AWS SQS

**Event Flow Example:**
```
1. User Service: user.registered event
   ↓
2. Notification Service: Sends welcome email
   ↓
3. Analytics Service: Logs registration event
   ↓
4. Search Service: Indexes user profile
```

**Event Schema:**
```typescript
interface DomainEvent {
  eventId: string;
  eventType: string;
  eventName: string;
  aggregateId: string;
  aggregateType: string;
  payload: any;
  metadata: {
    userId?: string;
    timestamp: string;
    correlationId: string;
    causationId?: string;
  };
}
```

**Event Publishing:**
```typescript
// In Observation Service
async function createObservation(data: CreateObservationDto) {
  const observation = await prisma.observation.create({ data });
  
  // Publish event
  await eventBus.publish({
    eventId: uuid(),
    eventType: 'observation',
    eventName: 'observation.created',
    aggregateId: observation.id,
    aggregateType: 'Observation',
    payload: {
      observationId: observation.id,
      teacherId: observation.teacherId,
      observerId: observation.observerId,
      date: observation.date
    },
    metadata: {
      userId: observation.observerId,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    }
  });
  
  return observation;
}
```

**Event Consumption:**
```typescript
// In Notification Service
eventBus.subscribe('observation.created', async (event) => {
  const { teacherId, observerId } = event.payload;
  
  // Send notification to teacher
  await createNotification({
    userId: teacherId,
    type: 'in-app',
    channel: 'observation',
    title: 'New Observation',
    message: 'You have received a new classroom observation',
    data: { observationId: event.aggregateId }
  });
  
  // Queue email
  await queueEmail({
    to: teacherEmail,
    subject: 'New Classroom Observation',
    template: 'observation_created',
    data: { observationId: event.aggregateId }
  });
});
```

---

## DEPLOYMENT ARCHITECTURE

### Kubernetes Deployment

```yaml
# user-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: production
spec:
  replicas: 5
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: registry.example.com/user-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: user-db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis_url
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 500m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: production
spec:
  selector:
    app: user-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 5
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## SERVICE DEPENDENCY MAP

```
┌─────────────────┐
│   API Gateway   │ ← Entry point for all requests
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┬────────┬────────┐
    │         │        │        │        │        │
┌───▼──┐  ┌──▼───┐ ┌──▼───┐ ┌──▼───┐ ┌──▼───┐ ┌─▼────┐
│ User │  │ Obs  │ │ Goal │ │ Doc  │ │Search│ │ File │
│Service│ │Service│ │Service│ │Service│ │Service│ │Service│
└───┬──┘  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └─┬────┘
    │        │        │        │        │        │
    └────────┴────────┴────────┴────────┴────────┘
                       │
                 ┌─────▼─────┐
                 │  Message  │
                 │   Broker  │
                 │ (RabbitMQ)│
                 └─────┬─────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
    │Notification│ │Analytics│ │Background│
    │  Service  │ │ Service │ │   Jobs  │
    └───────────┘ └─────────┘ └─────────┘
```

---

## MIGRATION STRATEGY

### Phase 1: Extract User Service (Week 3-4)
1. Create new user-service repository
2. Copy user-related code
3. Set up separate database
4. Deploy alongside monolith
5. Route /api/v1/users to new service
6. Monitor and validate

### Phase 2: Extract Observation Service (Week 5-6)
1. Create observation-service repository
2. Migrate observation code
3. Set up event publishing
4. Deploy and route traffic
5. Validate data consistency

### Phase 3: Extract Remaining Services (Week 7-10)
1. Goal Service
2. Document Service
3. Notification Service
4. Analytics Service

### Phase 4: Decommission Monolith (Week 11-12)
1. Verify all traffic routed to microservices
2. Shut down monolith
3. Clean up legacy code

---

## NEXT PHASE

Continue to **DATABASE_OPTIMIZATION.md** for database scaling strategy.
