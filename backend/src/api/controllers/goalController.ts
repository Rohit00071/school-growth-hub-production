import { Request, Response, NextFunction } from 'express';
import prisma from '../../infrastructure/database/prisma';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../../infrastructure/utils/AppError';
import { createGoalSchema } from '../../core/models/schemas';
import { goalService } from '../../services/goalService.cached';

export const getAllGoals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        if (authReq.user?.role === 'TEACHER') {
            const result = await goalService.getGoalsByTeacher(
                authReq.user.id,
                page,
                limit
            );

            return res.status(200).json({
                status: 'success',
                results: result.goals.length,
                total: result.total,
                page: result.page,
                totalPages: Math.ceil(result.total / limit),
                data: { goals: result.goals }
            });
        }

        // Leader/Admin view - all goals or filtered by teacherId
        const teacherId = req.query.teacherId as string;
        let filter = {};
        if (teacherId) {
            const result = await goalService.getGoalsByTeacher(
                teacherId,
                page,
                limit
            );
            return res.status(200).json({
                status: 'success',
                results: result.goals.length,
                total: result.total,
                page: result.page,
                totalPages: Math.ceil(result.total / limit),
                data: { goals: result.goals }
            });
        }

        const goals = await prisma.goal.findMany({
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        });

        const total = await prisma.goal.count();

        res.status(200).json({
            status: 'success',
            results: goals.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: { goals }
        });
    } catch (err) {
        next(err);
    }
};

export const createGoal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const result = createGoalSchema.safeParse(req.body);
        if (!result.success) {
            return next(new AppError('Validation failed', 400));
        }

        // Use cached service which handles cache invalidation
        const newGoal = await goalService.createGoal({
            ...result.data,
            teacherId: authReq.user!.id
        });

        res.status(201).json({
            status: 'success',
            data: { goal: newGoal }
        });
    } catch (err) {
        next(err);
    }
};
