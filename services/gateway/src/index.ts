import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 12348;

// Use environment variables for targets, default to localhost for local dev
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const OBSERVATION_SERVICE = process.env.OBSERVATION_SERVICE_URL || 'http://localhost:3002';
const GOAL_SERVICE = process.env.GOAL_SERVICE_URL || 'http://localhost:3003';
const DOCUMENT_SERVICE = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:3004';
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';
const ANALYTICS_SERVICE = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3006';
const MONOLITH_SERVICE = process.env.MONOLITH_SERVICE_URL || 'http://localhost:4000';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'UP', service: 'gateway' });
});

// Proxy Definitions

// User Service (Auth & Profile)
app.use(createProxyMiddleware({
    pathFilter: ['/api/v1/auth', '/api/v1/users'],
    target: USER_SERVICE,
    changeOrigin: true
}));

// Observation Service
app.use(createProxyMiddleware({
    pathFilter: ['/api/v1/observations'],
    target: OBSERVATION_SERVICE,
    changeOrigin: true
}));

// Goal Service
app.use(createProxyMiddleware({
    pathFilter: ['/api/v1/goals'],
    target: GOAL_SERVICE,
    changeOrigin: true
}));

// Document Service
app.use(createProxyMiddleware({
    pathFilter: ['/api/v1/documents'],
    target: DOCUMENT_SERVICE,
    changeOrigin: true
}));

// Notification Service
app.use(createProxyMiddleware({
    pathFilter: ['/api/v1/notifications'],
    target: NOTIFICATION_SERVICE,
    changeOrigin: true
}));

// Analytics Service
app.use(createProxyMiddleware({
    pathFilter: ['/api/v1/analytics'],
    target: ANALYTICS_SERVICE,
    changeOrigin: true
}));

// Monolith (Remaining Services)
app.use('/api/v1', createProxyMiddleware({
    target: MONOLITH_SERVICE,
    changeOrigin: true
}));

// Root route
app.get('/', (req: Request, res: Response) => {
    res.status(200).send('API Gateway is running. Microservices transition in progress.');
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`\n🚀 API Gateway running on port ${PORT}`);
});
