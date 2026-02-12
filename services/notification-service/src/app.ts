import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler';
import notificationRoutes from './routes';

const app = express();

// Security & Parsing
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/v1/notifications', notificationRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'notification-service' });
});

// Error Handling
app.use(errorHandler);

export default app;
