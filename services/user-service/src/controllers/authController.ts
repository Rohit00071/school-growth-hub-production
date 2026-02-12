import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { userService } from '../services/userService';
import { logger } from '../utils/logger';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    logger.error('FATAL: JWT_SECRET is not defined in production environment');
    process.exit(1);
}

const DEFAULT_SECRET = JWT_SECRET || 'dev-secret-key-only';

// Validation schemas
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
    role: z.enum(['ADMIN', 'LEADER', 'TEACHER', 'MANAGEMENT', 'SUPERADMIN']).optional(),
    campusId: z.string().optional(),
    department: z.string().optional()
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = registerSchema.parse(req.body);

        // Check if user exists
        const existingUser = await userService.getUserByEmail(validatedData.email);
        if (existingUser) {
            return res.status(400).json({ status: 'fail', message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 12);

        // Map string role to Enum or default
        const role = validatedData.role ? validatedData.role as Role : Role.TEACHER;

        const newUser = await userService.createUser({
            email: validatedData.email,
            password: hashedPassword,
            fullName: validatedData.fullName,
            role: role,
            campusId: validatedData.campusId,
            department: validatedData.department
        });

        // Create token
        // @ts-ignore
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, DEFAULT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });

        const userResponse = { ...newUser } as any;
        delete userResponse.password;

        res.status(201).json({
            status: 'success',
            token,
            data: {
                user: userResponse
            }
        });

        logger.info(`User registered: ${newUser.id}`);
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = loginSchema.parse(req.body);

        const user = await userService.getUserByEmail(validatedData.email);
        if (!user || !(await bcrypt.compare(validatedData.password, user.password))) {
            return res.status(401).json({ status: 'fail', message: 'Incorrect email or password' });
        }

        // @ts-ignore
        const token = jwt.sign({ id: user.id, role: user.role }, DEFAULT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });

        const userResponse = { ...user } as any;
        delete userResponse.password;

        res.status(200).json({
            status: 'success',
            token,
            data: {
                user: userResponse
            }
        });

        logger.info(`User logged in: ${user.id}`);
    } catch (error) {
        next(error);
    }
};
