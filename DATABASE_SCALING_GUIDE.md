# 🗄️ DATABASE SCALING GUIDE
## Connection Pooling & Read Replicas

This guide details how to scale the PostgreSQL database to support 100,000+ concurrent users using connection pooling (PgBouncer) and Read Replicas.

---

## 1. Connection Pooling (PgBouncer)

Connection pooling reduces the overhead of establishing new database connections.

### Configuration

If using **Neon**, connection pooling is built-in. efficient.

**Connection String Format:**
```
postgres://user:password@endpoint-pooler.region.aws.neon.tech/neondb?sslmode=require&connection_limit=20&pool_timeout=10
```

- `connection_limit`: Max connections per client
- `pool_timeout`: Max wait time for a connection (seconds)

### Local/Self-Hosted Setup

If running your own Postgres, use PgBouncer:

1. **Install PgBouncer:**
   ```bash
   sudo apt-get install pgbouncer
   ```

2. **Configure `pgbouncer.ini`:**
   ```ini
   [databases]
   school_growth_hub = host=127.0.0.1 port=5432 dbname=school_growth_hub

   [pgbouncer]
   listen_addr = *
   listen_port = 6432
   auth_type = md5
   auth_file = /etc/pgbouncer/userlist.txt
   pool_mode = transaction
   max_client_conn = 1000
   default_pool_size = 20
   ```

---

## 2. Read Replicas

Distribute read traffic to replica databases to offload the primary node.

### Application Logic

The application is configured to support read replicas via the `read` Prisma client instance (future implementation).

**Environment Variables:**
```env
DATABASE_URL="postgres://primary..."
DATABASE_READ_URL="postgres://replica..."
```

### Setup Instructions (Neon/AWS)

1. **Create Read Replica:**
   - Go to your database provider console.
   - Select "Create Read Replica".
   - Choose a region close to your users.

2. **Update Environment:**
   - Add `DATABASE_READ_URL` to your `.env` file.

---

## 3. Database Sharding (Future Phase)

For >500k users, horizontal sharding will be required.

**Strategy:** Shard by `CampusID` or `TenantID`.

**Schema Changes:**
All tables must include the shard key (`campusId`).

```sql
-- Example Sharding Logic
CREATE TABLE users (
    id UUID,
    campus_id UUID,
    ...
) PARTITION BY LIST (campus_id);
```

---

## ✅ Checklist for Scaling

- [ ] Enable Connection Pooling (Neon or PgBouncer)
- [ ] configure `connection_limit` in connection string
- [ ] Create Read Replica (if CPU usage > 50%)
- [ ] Set `DATABASE_READ_URL` in production
- [ ] Monitor connection count in Grafana/CloudWatch

---
**Status:** Ready for Phase 2 Implementation
