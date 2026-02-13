import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../infrastructure/utils/AppError';
import { logger } from '../../infrastructure/utils/logger';

export const globalAppErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    } else {
        // Production: don't leak error details
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        } else {
            // Log the error
            logger.error('ERROR 💥', err);

            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong!',
            });
        }
    }
};
