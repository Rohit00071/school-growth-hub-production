import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService';

export class NotificationController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const notification = await notificationService.createNotification(req.body);
            res.status(201).json(notification);
        } catch (error) { next(error); }
    }

    async getByUser(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params;
            const notifications = await notificationService.getNotificationsByUser(userId);
            res.status(200).json(notifications);
        } catch (error) { next(error); }
    }

    async markRead(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const notification = await notificationService.markAsRead(id);
            res.status(200).json(notification);
        } catch (error) { next(error); }
    }

    async markAllRead(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params;
            await notificationService.markAllAsRead(userId);
            res.status(200).json({ message: 'All notifications marked as read' });
        } catch (error) { next(error); }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await notificationService.deleteNotification(id);
            res.status(204).send();
        } catch (error) { next(error); }
    }
}

export const notificationController = new NotificationController();
