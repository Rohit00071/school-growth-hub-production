import { Notification, NotificationType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export interface CreateNotificationInput {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
}

export class NotificationService {
    async createNotification(data: CreateNotificationInput): Promise<Notification> {
        logger.info('Creating notification', data);
        return prisma.notification.create({ data });
    }

    async getNotificationsByUser(userId: string) {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async markAsRead(id: string): Promise<Notification> {
        return prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
    }

    async markAllAsRead(userId: string) {
        return prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
    }

    async deleteNotification(id: string): Promise<void> {
        await prisma.notification.delete({ where: { id } });
    }
}

export const notificationService = new NotificationService();
