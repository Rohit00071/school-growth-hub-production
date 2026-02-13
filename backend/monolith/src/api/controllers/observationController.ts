import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../../infrastructure/utils/AppError';
import prisma from '../../infrastructure/database/prisma';
import { getIO } from '../../core/socket';
import { observationService } from '../../services/observationService.cached';
import { userService } from '../../services/userService.cached';

export const getAllObservations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        // RBAC logic: Teachers only see their own
        if (authReq.user?.role === 'TEACHER') {
            const result = await observationService.getObservationsByTeacher(
                authReq.user.id,
                page,
                limit
            );

            return res.status(200).json({
                status: 'success',
                results: result.observations.length,
                total: result.total,
                page: result.page,
                totalPages: Math.ceil(result.total / limit),
                data: { observations: result.observations }
            });
        }

        // For ADMIN/LEADER - get all with pagination
        const observations = await prisma.observation.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                teacher: {
                    select: { id: true, fullName: true, email: true }
                },
                observer: {
                    select: { id: true, fullName: true, email: true }
                }
            }
        });

        const total = await prisma.observation.count();

        res.status(200).json({
            status: 'success',
            results: observations.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: { observations }
        });
    } catch (err) {
        next(err);
    }
};

export const createObservation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const data = req.body;

        // Try to link to a teacher user if email is provided (using cache)
        let teacherId = data.teacherId;
        if (!teacherId && data.teacherEmail) {
            const teacher = await userService.getUserByEmail(data.teacherEmail);
            if (teacher) teacherId = teacher.id;
        }

        const newObservationData = {
            ...data,
            teacherId: teacherId || 'unknown', // Fallback
            observerId: authReq.user?.id,
            status: 'SUBMITTED',
            createdAt: new Date().toISOString()
        };

        // Use cached service which handles cache invalidation
        const newObservation = await observationService.createObservation(newObservationData);

        // Real-time update
        getIO().emit('observation:created', newObservation);

        res.status(201).json({
            status: 'success',
            data: { observation: newObservation }
        });
    } catch (err) {
        next(err);
    }
};

export const updateObservation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Ensure id is a string
        const observationId = Array.isArray(id) ? id[0] : id;

        // Use cached service which handles cache invalidation
        const updatedObservation = await observationService.updateObservation(observationId, {
            ...data,
            updatedAt: new Date().toISOString()
        });

        getIO().emit('observation:updated', updatedObservation);

        res.status(200).json({
            status: 'success',
            data: { observation: updatedObservation }
        });
    } catch (err) {
        next(err);
    }
};
