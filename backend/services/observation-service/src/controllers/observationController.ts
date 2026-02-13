import { Request, Response, NextFunction } from 'express';
import { observationService } from '../services/observationService';
import { logger } from '../utils/logger';

export class ObservationController {
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const observation = await observationService.getObservationById(id);
            if (!observation) {
                return res.status(404).json({ status: 'fail', message: 'Observation not found' });
            }
            res.status(200).json({ status: 'success', data: { observation } });
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;

            const result = await observationService.getAllObservations(page, limit);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async getByTeacher(req: Request, res: Response, next: NextFunction) {
        try {
            const { teacherId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;

            const result = await observationService.getObservationsByTeacher(teacherId, page, limit);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async getByObserver(req: Request, res: Response, next: NextFunction) {
        try {
            const { observerId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;

            const result = await observationService.getObservationsByObserver(observerId, page, limit);
            res.status(200).json({ status: 'success', data: result });
        } catch (error) {
            next(error);
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const observation = await observationService.createObservation(req.body);
            res.status(201).json({ status: 'success', data: { observation } });
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const observation = await observationService.updateObservation(id, req.body);
            res.status(200).json({ status: 'success', data: { observation } });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await observationService.deleteObservation(id);
            res.status(204).json({ status: 'success', data: null });
        } catch (error) {
            next(error);
        }
    }

    async getStats(req: Request, res: Response, next: NextFunction) {
        try {
            const { teacherId } = req.params;
            const stats = await observationService.getObservationStats(teacherId);
            res.status(200).json({ status: 'success', data: { stats } });
        } catch (error) {
            next(error);
        }
    }
}

export const observationController = new ObservationController();
