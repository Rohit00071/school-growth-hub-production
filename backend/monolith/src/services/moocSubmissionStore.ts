import fs from 'fs/promises';
import path from 'path';

export type MoocReviewStatus = 'PENDING' | 'APPROVED' | 'NEEDS_CHANGES';

export interface MoocSubmissionRecord {
    id: string;
    submittedAt: string;
    email: string;
    name: string;
    campus: string;
    courseName: string;
    hours: number;
    platform: string;
    otherPlatform?: string;
    startDate?: string;
    endDate?: string;
    completionDate?: string;
    hasCertificate?: 'yes' | 'no';
    certificateType?: 'link' | 'file';
    proofLink?: string;
    certificateFile?: string;
    certificateFileName?: string;
    keyTakeaways?: string;
    unansweredQuestions?: string;
    enjoyedMost?: string;
    effectivenessRating?: number | number[];
    additionalFeedback?: string;
    supportingDocType?: 'link' | 'file';
    supportingDocLink?: string;
    supportingDocFile?: string;
    supportingDocFileName?: string;
    source?: 'legacy-form' | 'master-template' | 'unknown';
    reviewStatus: MoocReviewStatus;
    reviewerResponse?: string;
    reviewedAt?: string;
    reviewedByName?: string;
    reviewedByEmail?: string;
    reviewedByRole?: string;
    submittedByUserId?: string;
    submittedByRole?: string;
    rawData?: Record<string, unknown>;
}

export interface RequestActor {
    userId?: string;
    role?: string;
    email?: string;
    name?: string;
}

interface ReviewUpdateInput {
    reviewStatus: MoocReviewStatus;
    reviewerResponse?: string;
    reviewedByName?: string;
    reviewedByEmail?: string;
    reviewedByRole?: string;
}

const DATA_DIR = path.resolve(__dirname, '../../data');
const STORAGE_FILE = path.join(DATA_DIR, 'mooc-submissions.json');

let writeQueue: Promise<void> = Promise.resolve();

const asString = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
};

const asNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const toIsoDate = (value: unknown): string | undefined => {
    if (!value) return undefined;
    if (value instanceof Date) return value.toISOString();

    const str = asString(value);
    if (!str) return undefined;

    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const normalizeHasCertificate = (value: unknown): 'yes' | 'no' | undefined => {
    const normalized = asString(value).toLowerCase();
    if (normalized === 'yes') return 'yes';
    if (normalized === 'no') return 'no';
    return undefined;
};

const normalizeReviewStatus = (value: unknown): MoocReviewStatus => {
    const status = asString(value).toUpperCase();
    if (status === 'APPROVED') return 'APPROVED';
    if (status === 'NEEDS_CHANGES') return 'NEEDS_CHANGES';
    return 'PENDING';
};

const normalizeRating = (value: unknown): number | number[] | undefined => {
    if (Array.isArray(value) && value.length > 0) {
        const parsed = Number(value[0]);
        return Number.isFinite(parsed) ? [parsed] : undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const firstDefined = (...values: unknown[]): unknown => {
    for (const value of values) {
        if (value !== undefined && value !== null && asString(value) !== '') {
            return value;
        }
    }
    return undefined;
};

const generateId = (): string => `mooc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const stripRawData = (input: Record<string, unknown>): Record<string, unknown> => {
    const { rawData, ...rest } = input;
    return rest;
};

const ensureStoreFile = async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
        await fs.access(STORAGE_FILE);
    } catch {
        await fs.writeFile(STORAGE_FILE, '[]', 'utf8');
    }
};

const readRawSubmissions = async (): Promise<Record<string, unknown>[]> => {
    await ensureStoreFile();

    try {
        const raw = await fs.readFile(STORAGE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Failed to read MOOC submission store', error);
        return [];
    }
};

const writeSubmissions = async (submissions: MoocSubmissionRecord[]) => {
    const task = async () => {
        await ensureStoreFile();
        await fs.writeFile(STORAGE_FILE, JSON.stringify(submissions, null, 2), 'utf8');
    };

    writeQueue = writeQueue.then(task, task);
    await writeQueue;
};

const normalizeSubmission = (input: Record<string, unknown>): MoocSubmissionRecord => {
    const id = asString(firstDefined(input.id, input.submissionId, generateId()));
    const submittedAt = toIsoDate(firstDefined(input.submittedAt, input.createdAt, new Date())) || new Date().toISOString();

    const email = asString(firstDefined(input.email, input.m1));
    const name = asString(firstDefined(input.name, input.m2));
    const campus = asString(firstDefined(input.campus, input.m3));
    const courseName = asString(firstDefined(input.courseName, input.m4, 'MOOC Evidence Submission'));
    const hours = asNumber(firstDefined(input.hours, input.m5));
    const platform = asString(firstDefined(input.platform, input.m7, 'Unknown'));
    const otherPlatform = asString(firstDefined(input.otherPlatform, input.m8));

    const startDate = toIsoDate(firstDefined(input.startDate, input.m_start));
    const endDate = toIsoDate(firstDefined(input.endDate, input.completionDate, input.m_end));

    const hasCertificate = normalizeHasCertificate(firstDefined(input.hasCertificate, input.m9));
    const certificateType = asString(firstDefined(input.certificateType, input.m_certificate_type)) as 'link' | 'file' | '';
    const proofLink = asString(firstDefined(input.proofLink, input.m10));
    const certificateFile = asString(firstDefined(input.certificateFile, input.m_file));
    const certificateFileName = asString(firstDefined(input.certificateFileName, input.m_file_name));

    const keyTakeaways = asString(firstDefined(input.keyTakeaways, input.m11));
    const unansweredQuestions = asString(firstDefined(input.unansweredQuestions, input.m12));
    const enjoyedMost = asString(firstDefined(input.enjoyedMost, input.m13));
    const effectivenessRating = normalizeRating(firstDefined(input.effectivenessRating, input.m14));
    const additionalFeedback = asString(firstDefined(input.additionalFeedback, input.m15));

    const supportingDocType = asString(input.supportingDocType) as 'link' | 'file' | '';
    const supportingDocLink = asString(input.supportingDocLink);
    const supportingDocFile = asString(input.supportingDocFile);
    const supportingDocFileName = asString(input.supportingDocFileName);

    let source: MoocSubmissionRecord['source'] = 'unknown';
    if (input.source === 'legacy-form' || input.source === 'master-template') {
        source = input.source;
    } else if (email || courseName) {
        source = 'legacy-form';
    } else if (input.m1 || input.m4) {
        source = 'master-template';
    }

    return {
        id,
        submittedAt,
        email,
        name,
        campus,
        courseName,
        hours,
        platform,
        otherPlatform: otherPlatform || undefined,
        startDate,
        endDate,
        completionDate: endDate,
        hasCertificate,
        certificateType: certificateType || undefined,
        proofLink: proofLink || undefined,
        certificateFile: certificateFile || undefined,
        certificateFileName: certificateFileName || undefined,
        keyTakeaways: keyTakeaways || undefined,
        unansweredQuestions: unansweredQuestions || undefined,
        enjoyedMost: enjoyedMost || undefined,
        effectivenessRating,
        additionalFeedback: additionalFeedback || undefined,
        supportingDocType: supportingDocType || undefined,
        supportingDocLink: supportingDocLink || undefined,
        supportingDocFile: supportingDocFile || undefined,
        supportingDocFileName: supportingDocFileName || undefined,
        source,
        reviewStatus: normalizeReviewStatus(input.reviewStatus),
        reviewerResponse: asString(input.reviewerResponse) || undefined,
        reviewedAt: toIsoDate(input.reviewedAt),
        reviewedByName: asString(input.reviewedByName) || undefined,
        reviewedByEmail: asString(input.reviewedByEmail) || undefined,
        reviewedByRole: asString(input.reviewedByRole) || undefined,
        submittedByUserId: asString(input.submittedByUserId) || undefined,
        submittedByRole: asString(input.submittedByRole) || undefined,
        rawData: stripRawData(input),
    };
};

export const listMoocSubmissions = async (): Promise<MoocSubmissionRecord[]> => {
    const rawSubmissions = await readRawSubmissions();

    return rawSubmissions
        .map((item) => normalizeSubmission(item))
        .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
};

export const createMoocSubmission = async (
    payload: Record<string, unknown>,
    actor: RequestActor = {}
): Promise<MoocSubmissionRecord> => {
    const existing = await listMoocSubmissions();

    const submission = normalizeSubmission({
        ...payload,
        id: generateId(),
        submittedAt: new Date().toISOString(),
        reviewStatus: 'PENDING',
        submittedByUserId: actor.userId || payload.submittedByUserId,
        submittedByRole: actor.role || payload.submittedByRole,
    });

    await writeSubmissions([submission, ...existing]);
    return submission;
};

export const updateMoocSubmissionReviewById = async (
    submissionId: string,
    review: ReviewUpdateInput,
    actor: RequestActor = {}
): Promise<MoocSubmissionRecord | null> => {
    const submissions = await listMoocSubmissions();
    let updatedSubmission: MoocSubmissionRecord | null = null;

    const next = submissions.map((submission) => {
        if (submission.id !== submissionId) return submission;

        updatedSubmission = normalizeSubmission({
            ...submission,
            reviewStatus: review.reviewStatus,
            reviewerResponse: asString(review.reviewerResponse),
            reviewedAt: new Date().toISOString(),
            reviewedByName: asString(review.reviewedByName) || actor.name || submission.reviewedByName,
            reviewedByEmail: asString(review.reviewedByEmail) || actor.email || submission.reviewedByEmail,
            reviewedByRole: asString(review.reviewedByRole) || actor.role || submission.reviewedByRole,
        });

        return updatedSubmission;
    });

    if (!updatedSubmission) return null;

    await writeSubmissions(next);
    return updatedSubmission;
};
