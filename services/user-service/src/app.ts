import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';

const app = express();

// Security & Parsing
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'user-service' });
});

// Error Handling
app.use(errorHandler);

export default app;
