import express, { Request, Response, NextFunction } from 'express';
import { ClientRequest, IncomingMessage } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';

// Basic security and CORS
app.use(cors({
    origin: true, // Reflect request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Reminder', 'x-user-id', 'x-user-role', 'x-user-email']
}));

// DO NOT USE express.json() HERE. It consumes the body stream and hangs proxies.

app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'gateway', timestamp: new Date().toISOString() });
});

app.use((req, res, next) => {
    console.log(`[Gateway] ${req.method} ${req.url}`);
    next();
});

const handleAuthInRequest = (proxyReq: ClientRequest, req: any) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    console.log(`[Proxy] Incoming Header: ${authHeader ? 'Present' : 'Missing'} for ${req.method} ${req.url}`);

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            // Verification
            const decoded = jwt.verify(token, JWT_SECRET) as any;

            // Injected headers
            proxyReq.setHeader('x-user-id', String(decoded.id));
            proxyReq.setHeader('x-user-role', String(decoded.role));
            if (decoded.email) proxyReq.setHeader('x-user-email', String(decoded.email));

            // Remove Authorization to prevent conflicts
            proxyReq.removeHeader('Authorization');
            proxyReq.removeHeader('authorization');

            console.log(`[Proxy] Auth OK. Injected x-user-id: ${decoded.id}`);
        } catch (e) {
            console.warn(`[Proxy] Auth Fail: ${(e as Error).message}`);
        }
    } else {
        console.warn(`[Proxy] No Bearer token found in request to ${req.url}`);
    }
};

// Gateway Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'gateway', timestamp: new Date().toISOString() });
});

// Auth & Users (User Service)
app.use(createProxyMiddleware({
    pathFilter: ['/api/v1/auth', '/api/v1/users'],
    target: 'http://localhost:3001',
    changeOrigin: true,
    on: {
        proxyReq: (proxyReq, req, res) => {
            if (req.url.includes('/users')) {
                handleAuthInRequest(proxyReq, req);
            }
        },
        proxyRes: (proxyRes, req, res) => {
            if (req.url.includes('/auth/login')) {
                console.log(`[Proxy] Login Response: ${proxyRes.statusCode}`);
            }
        }
    }
}));

// Observations
app.use(createProxyMiddleware({
    pathFilter: '/api/v1/observations',
    target: 'http://localhost:3002',
    changeOrigin: true,
    on: { proxyReq: handleAuthInRequest }
}));

// Goals
app.use(createProxyMiddleware({
    pathFilter: '/api/v1/goals',
    target: 'http://localhost:3003',
    changeOrigin: true,
    on: { proxyReq: handleAuthInRequest }
}));

// Documents
app.use(createProxyMiddleware({
    pathFilter: '/api/v1/documents',
    target: 'http://localhost:3004',
    changeOrigin: true,
    on: { proxyReq: handleAuthInRequest }
}));

// Notifications
app.use(createProxyMiddleware({
    pathFilter: '/api/v1/notifications',
    target: 'http://localhost:3005',
    changeOrigin: true,
    on: { proxyReq: handleAuthInRequest }
}));

// Analytics
app.use(createProxyMiddleware({
    pathFilter: '/api/v1/analytics',
    target: 'http://localhost:3006',
    changeOrigin: true,
    on: { proxyReq: handleAuthInRequest }
}));

// Socket.io
app.use('/socket.io', createProxyMiddleware({
    target: 'http://localhost:4000',
    changeOrigin: true,
    ws: true
}));

// Fallback to Monolith
app.use(createProxyMiddleware({
    pathFilter: '/api/v1',
    target: 'http://localhost:4000',
    changeOrigin: true,
    on: { proxyReq: handleAuthInRequest }
}));

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Gateway ready on port ${PORT}`);
});
