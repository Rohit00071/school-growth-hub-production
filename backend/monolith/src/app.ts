
import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
// Initialize environment variables as early as possible
dotenv.config({ override: true });

import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import routes from './api/routes';
import { globalAppErrorHandler } from './api/middlewares/errorHandler';
import { cacheControl } from './api/middlewares/cacheControl';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const app: Application = express();

// Middlewares
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:8081',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:5173',
        'http://localhost:3000',
        /\.loca\.lt$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Reminder']
}));

// Microservices Proxy (Must be before body parsers)
app.use(
    ['/api/v1/auth', '/api/v1/users'],
    createProxyMiddleware({
        target: 'http://localhost:3001',
        changeOrigin: true
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'School Growth Hub API',
            version: '1.0.0',
            description: 'API for managing educator observations and professional development',
        },
        servers: [{ url: '/api/v1' }],
    },
    apis: ['./src/api/routes/*.ts'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Cache Control
app.use(cacheControl);

// API Routes
app.use('/api/v1', routes);

// Global Error Handler
app.use(globalAppErrorHandler);

// Health Check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req: Request, res: Response) => {
    res.status(200).send('School Growth Hub API is running!');
});

export default app;
