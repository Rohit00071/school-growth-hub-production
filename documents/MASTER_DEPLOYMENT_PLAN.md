# 🏗️ MASTER DEPLOYMENT PLAN: School Growth Hub

This guide provides the step-by-step roadmap for deploying the School Growth Hub into a production environment, following the progressive transition from Phase 1 (Optimization) to Phase 4 (Enterprise Cloud).

---

## 🛠️ Phase 1: Infrastructure Foundations
**Goal:** Prepare the managed services that will support the microservices.

### 1. Database Provisioning (PostgreSQL)
*   **Recommended:** [Neon.tech](https://neon.tech) or AWS RDS.
*   **Steps:**
    1.  Create a fresh PostgreSQL database.
    2.  **Crucial:** Create the target schemas manually or allow Prisma to do it if the user has `CREATE` permissions.
        ```sql
        CREATE SCHEMA IF NOT EXISTS observation_service;
        CREATE SCHEMA IF NOT EXISTS goal_service;
        CREATE SCHEMA IF NOT EXISTS document_service;
        CREATE SCHEMA IF NOT EXISTS notification_service;
        CREATE SCHEMA IF NOT EXISTS analytics_service;
        ```
    3.  Obtain your `DATABASE_URL`.

### 2. Cache & Event Bus (Redis)
*   **Recommended:** [Upstash](https://upstash.com) (Serverless Redis) or AWS Elasticache.
*   **Steps:**
    1.  Create a Redis instance.
    2.  Note the `REDIS_URL` (Format: `redis://user:password@host:port`).

---

## 🚀 Phase 2: Building the Microservices
**Goal:** Compile the code and package it into immutable containers.

### 1. Environment Configuration
Create a production `.env` file at the root based on `.env.example`:
```env
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
REDIS_URL=redis://host:port
JWT_SECRET=YOUR_SECURE_RANDOM_KEY
VITE_API_URL=https://api.yourdomain.com/api/v1
```

### 2. The Build Pipeline (CI/CD)
The project is already equipped with a **GitHub Actions CI**.
*   **Step:** Push your code to the `main` branch.
*   **Action:** GitHub will automatically verify that all 8 services (6 microservices + Gateway + Monolith) build correctly.

#### 🛠️ Manual Build Command:
If you need to build locally to test:
```bash
docker-compose build
```

---

## 🛳️ Phase 3: Service Orchestration
**Goal:** Launching the cluster in a production environment.

### 1. Deployment via Docker Compose (Recommended for Starters)
1.  Transfer your project files to your production VM (e.g., EC2, Droplet).
2.  Install Docker & Docker Compose.
3.  Run the stack:
    ```bash
    docker-compose up -d
    ```

### 2. Verification Steps
Verify that all internal micro-networks are functioning:
```bash
# Check container status
docker ps

# Test Gateway health
curl http://localhost:12348/health

# Test internal service through Gateway
curl http://localhost:12348/api/v1/auth/health
```

---

## 🌍 Phase 4: Global Networking & Security
**Goal:** Exposing the app to the internet securely.

### 1. Domain & SSL (Nginx Reverse Proxy)
You should use a reverse proxy or Cloudflare in front of the Gateway.
*   **Entry Point:** Port 12348 (Gateway) should be mapped to `api.yourdomain.com`.
*   **SSL:** Use Certbot for Let's Encrypt.

### 2. Frontend Hosting
The Frontend is optimized for static hosting.
*   **Option A:** [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
    *   Point to the root folder.
    *   Set `VITE_API_URL` to your production gateway URL.
*   **Option B:** Docker (Included).
    *   The `frontend` service in `docker-compose` serves the app via Nginx on Port 80.

---

## 📝 Summary of Phases & Responsibilities

| Phase | Responsibility | Key Files |
| :--- | :--- | :--- |
| **P1: Infra** | DevOps / Cloud Console | Neon Dashboard, Redis Config |
| **P2: Build** | Developer / GitHub Actions | `Dockerfile`, `main.yml` |
| **P3: Launch** | SRE / Docker Compose | `docker-compose.yml`, `.env` |
| **P4: Networking** | System Admin | Nginx Config, Cloudflare |

### 🛑 Deployment Safety Checklist
1.  [ ] **JWT_SECRET**: Is it a strong random string?
2.  [ ] **DB_INDEXES**: Have you run `backend/prisma/migrations/add_performance_indexes.sql` on the primary DB?
3.  [ ] **CORS**: Is `cors` in `gateway/src/index.ts` restricted to your production domain?
4.  [ ] **REPLICAS**: If using Swarm/K8s, have you scaled the `observation-service` and `goal-service` to at least 2 replicas for HA?
