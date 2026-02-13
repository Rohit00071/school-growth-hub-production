const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
require('dotenv').config({ override: true });

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';

// DO NOT USE any body-parsing middleware here to avoid proxy hangs

app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.headers['x-user-id'] = decoded.id;
            req.headers['x-user-role'] = decoded.role;
            if (decoded.email) req.headers['x-user-email'] = decoded.email;
            if (decoded.fullName) req.headers['x-user-name'] = decoded.fullName;
            console.log(`Auth OK for ${decoded.id}`);
        } catch (e) {
            console.warn('Auth Fail');
        }
    }
    next();
});

const proxyOptions = {
    changeOrigin: true,
    logLevel: 'debug'
};

app.use('/api/v1/auth', createProxyMiddleware({ ...proxyOptions, target: 'http://localhost:3001' }));
app.use('/api/v1/users', createProxyMiddleware({ ...proxyOptions, target: 'http://localhost:3001' }));
app.use('/api/v1/observations', createProxyMiddleware({ ...proxyOptions, target: 'http://localhost:3002' }));
app.use('/api/v1/goals', createProxyMiddleware({ ...proxyOptions, target: 'http://localhost:3003' }));
app.use('/api/v1/documents', createProxyMiddleware({ ...proxyOptions, target: 'http://localhost:3004' }));
app.use('/api/v1/notifications', createProxyMiddleware({ ...proxyOptions, target: 'http://localhost:3005' }));
app.use('/api/v1/analytics', createProxyMiddleware({ ...proxyOptions, target: 'http://localhost:3006' }));
app.use('/socket.io', createProxyMiddleware({ ...proxyOptions, target: 'http://localhost:4000', ws: true }));
app.use('/api/v1', createProxyMiddleware({ ...proxyOptions, target: 'http://localhost:4000' }));

app.listen(12348, '0.0.0.0', () => console.log('Minimalist Gateway on 12348'));
