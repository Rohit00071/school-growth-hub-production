import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        email?: string;
    };
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-only';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Check for Gateway-injected headers first (Trusted Internal Network)
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const userEmail = req.headers['x-user-email'] as string;

    if (userId && userRole) {
        req.user = {
            id: userId,
            role: userRole,
            email: userEmail
        };
        return next();
    }

    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ status: 'fail', message: 'You are not logged in' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string, role: string, email?: string };
        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email
        };
        next();
    } catch (err) {
        return res.status(401).json({ status: 'fail', message: 'Invalid token' });
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ status: 'fail', message: 'Permission denied' });
        }
        next();
    };
};
