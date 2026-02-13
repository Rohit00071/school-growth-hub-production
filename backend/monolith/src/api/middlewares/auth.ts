import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../infrastructure/utils/AppError';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

import { userService } from '../../services/userService.cached';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('You are not logged in. Please log in to get access.', 401));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string, role: string };

        // Check if user still exists (using cache for performance)
        const currentUser = await userService.getUserById(decoded.id);
        if (!currentUser) {
            return next(
                new AppError('The user belonging to this token no longer exists.', 401)
            );
        }

        // Grant access to protected route
        req.user = {
            id: currentUser.id,
            role: currentUser.role
        };
        next();
    } catch (err) {
        return next(new AppError('Invalid token. Please log in again.', 401));
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};
