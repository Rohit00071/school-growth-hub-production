import { Request, Response, NextFunction } from 'express';
import { goalService } from '../services/goalService';

export class GoalController {
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const goal = await goalService.getGoalById(id);
            if (!goal) return res.status(404).json({ message: 'Goal not found' });
            res.status(200).json(goal);
        } catch (error) { next(error); }
    }

    async getByTeacher(req: Request, res: Response, next: NextFunction) {
        try {
            const { teacherId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const result = await goalService.getGoalsByTeacher(teacherId, page, limit);
            res.status(200).json(result);
        } catch (error) { next(error); }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const goal = await goalService.createGoal(req.body);
            res.status(201).json(goal);
        } catch (error) { next(error); }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const goal = await goalService.updateGoal(id, req.body);
            res.status(200).json(goal);
        } catch (error) { next(error); }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await goalService.deleteGoal(id);
            res.status(204).send();
        } catch (error) { next(error); }
    }
}

export const goalController = new GoalController();
