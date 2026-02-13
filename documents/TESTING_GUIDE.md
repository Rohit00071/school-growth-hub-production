# Microservices Integration Testing Guide

## Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Port 5173)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              API Gateway (Port 12348)                    │
│  • Routes /api/v1/auth → User Service                   │
│  • Routes /api/v1/users → User Service                  │
│  • Routes /api/v1/* → Monolith Backend                  │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────┐   ┌─────────────────────────────┐
│  User Service (3001) │   │  Monolith Backend (4000)    │
│  • Authentication    │   │  • Observations             │
│  • User Management   │   │  • Goals                    │
│  • JWT Generation    │   │  • Documents                │
│  • Redis Caching     │   │  • Acknowledgements         │
└──────────────────────┘   └─────────────────────────────┘
```

## Service Status

### ✅ API Gateway
- **Port**: 12348
- **Status**: Running
- **Test**: `curl http://localhost:12348/health`
- **Expected**: `{"status":"UP","service":"gateway"}`

### ✅ User Service
- **Port**: 3001
- **Status**: Running
- **Test**: `curl http://localhost:3001/health`
- **Expected**: `{"status":"UP","service":"user-service"}`

### ❌ Monolith Backend
- **Port**: 4000
- **Status**: Not Running (Prisma issues)
- **Blocker**: Database client generation failing

## Testing Endpoints

### 1. Health Checks
```bash
# Gateway
curl http://localhost:12348/health

# User Service (direct)
curl http://localhost:3001/health

# User Service (via Gateway)
curl http://localhost:12348/api/v1/auth/health
```

### 2. User Registration (Once DB is fixed)
```bash
curl -X POST http://localhost:12348/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "SecurePass123!",
    "fullName": "Jane Teacher",
    "role": "TEACHER"
  }'
```

### 3. User Login (Once DB is fixed)
```bash
curl -X POST http://localhost:12348/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "SecurePass123!"
  }'
```

### 4. Get User Profile (Once DB is fixed)
```bash
# Replace {token} with JWT from login response
curl http://localhost:12348/api/v1/users/me \
  -H "Authorization: Bearer {token}"
```

## Current Issues

### Database Connection
- **Problem**: Prisma client generation failing
- **Error**: File permission issues with query engine DLL
- **Solution**: Need to stop services and regenerate clients

### Schema Coordination
- **Problem**: User Service and Monolith using same database
- **Impact**: Schema conflicts and migration issues
- **Solution**: Implement separate schemas or databases

## Next Development Steps

1. **Fix Database Issues**
   - Stop all services
   - Regenerate Prisma clients
   - Implement schema separation

2. **Complete Integration Testing**
   - Test user registration flow
   - Test authentication flow
   - Verify JWT token generation
   - Test user profile retrieval

3. **Frontend Integration**
   - Update API base URL to point to Gateway (12348)
   - Test login from frontend
   - Verify token storage and refresh

4. **Extract Next Service**
   - Choose: Observation Service or Goal Service
   - Follow same pattern as User Service
   - Update Gateway routing

## Service Startup Order

```bash
# 1. Start User Service
cd services/user-service
npm run dev

# 2. Start API Gateway
cd services/gateway
npm run dev

# 3. Start Monolith Backend (when fixed)
cd backend
npm run dev

# 4. Start Frontend
cd frontend
npm run dev
```

## Environment Variables

### User Service (.env)
```
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
JWT_EXPIRES_IN="1d"
PORT=3001
REDIS_URL="redis://localhost:6379"
```

### API Gateway (.env)
```
PORT=12348
USER_SERVICE_URL="http://localhost:3001"
BACKEND_SERVICE_URL="http://localhost:4000"
```

### Backend (.env)
```
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
PORT=4000
REDIS_URL="redis://localhost:6379"
```

## Monitoring

### Check Running Services
```bash
# Windows
netstat -ano | findstr "3001 4000 12348"

# Check Node processes
tasklist | findstr node
```

### View Logs
- User Service: Check terminal where `npm run dev` is running
- Gateway: Check terminal output
- Backend: Check terminal output

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :{PORT}

# Kill process (replace PID)
taskkill /PID {PID} /F
```

### Prisma Issues
```bash
# Regenerate client
npx prisma generate

# Reset database (CAUTION: Deletes data)
npx prisma migrate reset

# View current schema
npx prisma db pull
```

### Gateway Not Proxying
- Check User Service is running on 3001
- Check Gateway logs for proxy errors
- Verify CORS settings
- Test direct User Service endpoint first
