import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService';

export class AnalyticsController {
    async track(req: Request, res: Response, next: NextFunction) {
        try {
            const metric = await analyticsService.trackMetric(req.body);
            res.status(201).json(metric);
        } catch (error) { next(error); }
    }

    async getByName(req: Request, res: Response, next: NextFunction) {
        try {
            const { name } = req.params;
            const metrics = await analyticsService.getMetricsByName(name);
            res.status(200).json(metrics);
        } catch (error) { next(error); }
    }

    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const stats = await analyticsService.getSystemStats();
            res.status(200).json(stats);
        } catch (error) { next(error); }
    }
}

export const analyticsController = new AnalyticsController();
