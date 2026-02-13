import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../infrastructure/utils/AppError';
import {
    createMoocSubmission,
    listMoocSubmissions,
    MoocReviewStatus,
    RequestActor,
    updateMoocSubmissionReviewById,
} from '../../services/moocSubmissionStore';

const getHeaderValue = (value: string | string[] | undefined): string | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value[0];
    return value;
};

const getRequestActor = (req: Request): RequestActor => ({
    userId: getHeaderValue(req.headers['x-user-id']),
    role: getHeaderValue(req.headers['x-user-role'])?.toUpperCase(),
    email: getHeaderValue(req.headers['x-user-email']),
    name: getHeaderValue(req.headers['x-user-name']),
});

const normalizeReviewStatus = (value: unknown): MoocReviewStatus => {
    const status = String(value || '').toUpperCase();
    if (status === 'APPROVED') return 'APPROVED';
    if (status === 'NEEDS_CHANGES') return 'NEEDS_CHANGES';
    return 'PENDING';
};

export const getAllMoocSubmissions = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const submissions = await listMoocSubmissions();

        res.status(200).json({
            status: 'success',
            results: submissions.length,
            data: { submissions },
        });
    } catch (error) {
        next(error);
    }
};

export const createMoocSubmissionEntry = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return next(new AppError('Invalid MOOC submission payload.', 400));
        }

        const actor = getRequestActor(req);
        const submission = await createMoocSubmission(req.body as Record<string, unknown>, actor);

        res.status(201).json({
            status: 'success',
            data: { submission },
        });
    } catch (error) {
        next(error);
    }
};

export const reviewMoocSubmission = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;
        const submissionId = Array.isArray(id) ? id[0] : id;

        if (!submissionId) {
            return next(new AppError('Submission id is required.', 400));
        }

        const actor = getRequestActor(req);
        const reviewBody = (req.body || {}) as Record<string, unknown>;
        const actorRole = String(actor.role || reviewBody.reviewedByRole || '').toUpperCase();

        if (actorRole && !['LEADER', 'ADMIN', 'SUPERADMIN'].includes(actorRole)) {
            return next(new AppError('Only leader/admin users can review MOOC submissions.', 403));
        }

        const updated = await updateMoocSubmissionReviewById(
            submissionId,
            {
                reviewStatus: normalizeReviewStatus(reviewBody.reviewStatus),
                reviewerResponse: String(reviewBody.reviewerResponse || ''),
                reviewedByName: String(reviewBody.reviewedByName || ''),
                reviewedByEmail: String(reviewBody.reviewedByEmail || ''),
                reviewedByRole: String(reviewBody.reviewedByRole || actorRole || ''),
            },
            actor
        );

        if (!updated) {
            return next(new AppError('MOOC submission not found.', 404));
        }

        res.status(200).json({
            status: 'success',
            data: { submission: updated },
        });
    } catch (error) {
        next(error);
    }
};
