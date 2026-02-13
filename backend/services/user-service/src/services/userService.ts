import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { User, Prisma } from '@prisma/client';

export class UserService {
    private db = prisma;

    async getUserById(id: string): Promise<User | null> {
        logger.info(`Getting user by ID: ${id}`);
        return this.db.user.findUnique({
            where: { id }
        });
    }

    async getUserByEmail(email: string): Promise<User | null> {
        logger.info(`Getting user by email: ${email}`);
        return this.db.user.findUnique({
            where: { email }
        });
    }

    async getAllUsers(role?: string): Promise<User[]> {
        logger.info(`Getting users, role filter: ${role || 'ALL'}`);
        return this.db.user.findMany({
            where: role ? { role: role as any } : undefined,
            orderBy: { createdAt: 'desc' }
        });
    }

    async createUser(data: Prisma.UserCreateInput): Promise<User> {
        logger.info('Creating user:', { email: data.email });
        const user = await this.db.user.create({
            data
        });
        logger.info('User created successfully:', { id: user.id });
        return user;
    }

    async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        const user = await this.db.user.update({
            where: { id },
            data
        });
        return user;
    }

    async deleteUser(id: string): Promise<void> {
        const user = await this.db.user.findUnique({ where: { id } });
        if (!user) return;

        await this.db.user.delete({ where: { id } });

        // Notify other services
        const { eventBus, EVENT_CHANNELS } = require('../utils/eventBus');
        await eventBus.publish(EVENT_CHANNELS.USER_DELETED, { userId: id });

        logger.info(`[User] User deleted and event published: ${id}`);
    }

    // Auth related
    async verifyPassword(password: string, hash: string): Promise<boolean> {
        const bcrypt = require('bcryptjs');
        return bcrypt.compare(password, hash);
    }
}

export const userService = new UserService();
