import { Document, DocumentAcknowledgement } from '@prisma/client';
import { prisma } from '../config/prisma';
import { redis } from '../utils/redis';
import { logger } from '../utils/logger';
import { eventBus, EVENT_CHANNELS } from '../utils/eventBus';

export class DocumentService {
    async getDocumentById(id: string) {
        return prisma.document.findUnique({
            where: { id },
            include: { acknowledgements: true }
        });
    }

    async listDocuments() {
        return prisma.document.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    async createDocument(data: any): Promise<Document> {
        logger.info('Creating new document');
        return prisma.document.create({ data });
    }

    async acknowledgeDocument(documentId: string, teacherId: string, data: any): Promise<DocumentAcknowledgement> {
        logger.info(`Teacher ${teacherId} acknowledging document ${documentId}`);
        const acknowledgement = await prisma.documentAcknowledgement.upsert({
            where: { documentId_teacherId: { documentId, teacherId } },
            update: {
                status: 'ACKNOWLEDGED',
                acknowledgedAt: new Date(),
                ...data
            },
            create: {
                documentId,
                teacherId,
                status: 'ACKNOWLEDGED',
                acknowledgedAt: new Date(),
                ...data
            }
        });

        // Publish event
        await eventBus.publish(EVENT_CHANNELS.DOCUMENT_ACKNOWLEDGED, {
            documentId,
            teacherId,
            status: 'ACKNOWLEDGED'
        });

        return acknowledgement;
    }

    async getAcknowlegementsByTeacher(teacherId: string) {
        return prisma.documentAcknowledgement.findMany({
            where: { teacherId },
            include: { document: true }
        });
    }
}

export const documentService = new DocumentService();
