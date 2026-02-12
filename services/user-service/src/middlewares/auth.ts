import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userService } from '../services/userService';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string, role: string };

        // Check if user still exists (using cache)
        const currentUser = await userService.getUserById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({ status: 'fail', message: 'User no longer exists' });
        }

        req.user = {
            id: currentUser.id,
            role: currentUser.role
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
