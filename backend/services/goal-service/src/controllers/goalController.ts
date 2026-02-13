import { Request, Response, NextFunction } from 'express';
import { goalService } from '../services/goalService';

export class GoalController {
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const goal = await goalService.getGoalById(id);
            if (!goal) return res.status(404).json({ status: 'fail', message: 'Goal not found' });
            res.status(200).json({ status: 'success', data: { goal } });
        } catch (error) { next(error); }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const result = await goalService.getAllGoals(page, limit);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    }

    async getByTeacher(req: Request, res: Response, next: NextFunction) {
        try {
            const { teacherId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const result = await goalService.getGoalsByTeacher(teacherId, page, limit);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) { next(error); }
    }

    async create(req: any, res: Response, next: NextFunction) {
        try {
            const data = { ...req.body };

            // Auto-inject teacherId from auth if not provided
            if (!data.teacherId && req.user?.id) {
                data.teacherId = req.user.id;
            }

            // Convert dueDate to Date object if it's a string
            if (data.dueDate && typeof data.dueDate === 'string') {
                data.dueDate = new Date(data.dueDate);
            }

            const goal = await goalService.createGoal(data);
            res.status(201).json({ status: 'success', data: { goal } });
        } catch (error) { next(error); }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const goal = await goalService.updateGoal(id, req.body);
            res.status(200).json({ status: 'success', data: { goal } });
        } catch (error) { next(error); }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await goalService.deleteGoal(id);
            res.status(204).json({ status: 'success', data: null });
        } catch (error) { next(error); }
    }
}

export const goalController = new GoalController();
