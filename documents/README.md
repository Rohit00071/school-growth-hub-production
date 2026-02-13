# 🚀 School Growth Hub - Production Ready

Enterprise-grade microservices architecture for school management, performance tracking, and professional development.

## 🏗 Architecture
- **API Gateway**: Unified entry point for all services.
- **User Service**: Auth & Profile management.
- **Observation Service**: Performance tracking & Feedback.
- **Goal Service**: Professional growth tracking.
- **Notification Service**: Real-time events & system alerts.
- **Analytics Service**: Cross-service data insights.
- **Legacy Monolith**: Fallback for legacy features.

## 🚀 One-Click Deployment
This project is pre-configured with **Render Blueprint** and **Docker Compose**.

### Option A: Render (Microservices)
1. Push to your GitHub repository.
2. Go to **Render Dashboard** -> **Blueprints**.
3. Select this repo and click **Apply**.
4. Set your `DATABASE_URL` and `JWT_SECRET` in the dashboard.

### Option B: VPS (Single Server)
If you have a server with Docker:
```bash
git clone https://github.com/Rohit00071/school-growth-hub-production.git
cd school-growth-hub-production
cp .env.example .env && nano .env
docker-compose up -d --build
```

### Option C: Vercel (Frontend Only)
The frontend is optimized for Vercel. Connect your repo and set:
`VITE_API_URL` = `https://your-gateway-url.com/api/v1`

## 🔒 Security & Performance
- **JWT Protection**: All microservices are secured by a unified auth perimeter.
- **Redis Caching**: 10-50x speedup on dashboard and stats queries.
- **Event Bus**: Asynchronous cross-service cleanup on user deletion.
- **Structured Logging**: JSON logs for production monitoring.

## 🛠 Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon.tech)
- **Cache**: Redis (Upstash)
- **Orchestration**: Docker & Render Blueprints
