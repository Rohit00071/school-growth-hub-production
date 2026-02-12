import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { AuthRequest } from '../middlewares/auth';
import { logger } from '../utils/logger';

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await userService.getUserById(req.user!.id);
        if (user) (user as any).password = undefined;
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (err) {
        next(err);
    }
};

export const updateMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Implement filter for allowed fields
        const allowedFields = ['fullName', 'avatarUrl', 'department'];
        const filteredBody = Object.keys(req.body)
            .filter(key => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = req.body[key];
                return obj;
            }, {} as any);

        const updatedUser = await userService.updateUser(req.user!.id, filteredBody);
        if (updatedUser) (updatedUser as any).password = undefined;

        res.status(200).json({
            status: 'success',
            data: { user: updatedUser }
        });
    } catch (err) {
        next(err);
    }
};

export const deleteMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await userService.deleteUser(req.user!.id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }
        (user as any).password = undefined;
        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (err) {
        next(err);
    }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    // TODO: implement pagination and filtering in UserService
    res.status(501).json({ status: 'fail', message: 'Not implemented' });
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        await userService.deleteUser(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        next(err);
    }
};
