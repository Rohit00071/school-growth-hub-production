import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error('Unhandled Rejection', err);

    const statusCode = (err as any).statusCode || 500;
    const message = (err as any).message || 'Internal Server Error';

    res.status(statusCode).json({
        status: 'error',
        message,
    });
};
