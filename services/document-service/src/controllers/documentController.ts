import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/documentService';
import { AuthRequest } from '../middlewares/auth';

export class DocumentController {
    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const doc = await documentService.getDocumentById(id);
            if (!doc) return res.status(404).json({ message: 'Document not found' });
            res.status(200).json(doc);
        } catch (error) { next(error); }
    }

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const docs = await documentService.listDocuments();
            res.status(200).json(docs);
        } catch (error) { next(error); }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const doc = await documentService.createDocument(req.body);
            res.status(201).json(doc);
        } catch (error) { next(error); }
    }

    async acknowledge(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const teacherId = req.user?.id;

            if (!teacherId) {
                return res.status(401).json({ message: 'User not authenticated' });
            }

            const ack = await documentService.acknowledgeDocument(id, teacherId, req.body);
            res.status(200).json(ack);
        } catch (error) { next(error); }
    }

    async getTeacherAcks(req: Request, res: Response, next: NextFunction) {
        try {
            const { teacherId } = req.params;
            const acks = await documentService.getAcknowlegementsByTeacher(teacherId);
            res.status(200).json(acks);
        } catch (error) { next(error); }
    }
}

export const documentController = new DocumentController();
