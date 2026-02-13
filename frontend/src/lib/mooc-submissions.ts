import api from "@/lib/api";

export type MoocReviewStatus = "PENDING" | "APPROVED" | "NEEDS_CHANGES";

export interface MoocSubmission {
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
  hasCertificate?: "yes" | "no";
  certificateType?: "link" | "file";
  proofLink?: string;
  certificateFile?: string;
  certificateFileName?: string;
  keyTakeaways?: string;
  unansweredQuestions?: string;
  enjoyedMost?: string;
  effectivenessRating?: number | number[];
  additionalFeedback?: string;
  supportingDocType?: "link" | "file";
  supportingDocLink?: string;
  supportingDocFile?: string;
  supportingDocFileName?: string;
  source?: "legacy-form" | "master-template" | "unknown";
  reviewStatus: MoocReviewStatus;
  reviewerResponse?: string;
  reviewedAt?: string;
  reviewedByName?: string;
  reviewedByEmail?: string;
  reviewedByRole?: string;
  rawData?: Record<string, any>;
}

const STORAGE_KEY = "mooc_submissions";
const UPDATE_EVENT = "mooc-submission-updated";

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null;

const stripNestedRawData = (value: unknown): Record<string, any> => {
  if (!isObject(value)) return {};
  const { rawData, ...rest } = value;
  return rest;
};

const asString = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeDate = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();

  const str = asString(value);
  if (!str) return undefined;

  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const normalizeNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeRating = (value: unknown): number | number[] | undefined => {
  if (Array.isArray(value) && value.length > 0) {
    const parsed = Number(value[0]);
    return Number.isFinite(parsed) ? [parsed] : undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const normalizeHasCertificate = (value: unknown): "yes" | "no" | undefined => {
  const normalized = asString(value).toLowerCase();
  if (normalized === "yes") return "yes";
  if (normalized === "no") return "no";
  return undefined;
};

const firstDefined = (...values: unknown[]): unknown => {
  for (const value of values) {
    if (value !== undefined && value !== null && asString(value) !== "") {
      return value;
    }
  }
  return undefined;
};

const createSubmissionId = (): string =>
  `mooc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const parseRaw = (): Record<string, any>[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse MOOC submissions", error);
    return [];
  }
};

const dispatchUpdatedEvent = () => {
  window.dispatchEvent(new Event(UPDATE_EVENT));
};

const sortSubmissions = (submissions: MoocSubmission[]): MoocSubmission[] => {
  return [...submissions].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
};

const writeCache = (submissions: MoocSubmission[], emitEvent: boolean) => {
  const sorted = sortSubmissions(submissions);
  const serialized = JSON.stringify(sorted);
  const existing = localStorage.getItem(STORAGE_KEY);

  if (existing !== serialized) {
    localStorage.setItem(STORAGE_KEY, serialized);
    if (emitEvent) {
      dispatchUpdatedEvent();
    }
  }
};

export const normalizeMoocSubmission = (input: unknown): MoocSubmission => {
  const raw = isObject(input) ? input : {};

  const id = asString(firstDefined(raw.id, raw.submissionId, createSubmissionId()));
  const submittedAt =
    normalizeDate(firstDefined(raw.submittedAt, raw.createdAt, new Date())) ||
    new Date().toISOString();

  const email = asString(firstDefined(raw.email, raw.m1));
  const name = asString(firstDefined(raw.name, raw.m2));
  const campus = asString(firstDefined(raw.campus, raw.m3));
  const courseName = asString(
    firstDefined(raw.courseName, raw.m4, "MOOC Evidence Submission")
  );
  const hours = normalizeNumber(firstDefined(raw.hours, raw.m5));
  const platform = asString(firstDefined(raw.platform, raw.m7, "Unknown"));
  const otherPlatform = asString(firstDefined(raw.otherPlatform, raw.m8));
  const startDate = normalizeDate(firstDefined(raw.startDate, raw.m_start));
  const endDate = normalizeDate(
    firstDefined(raw.endDate, raw.completionDate, raw.m_end)
  );
  const completionDate = endDate;

  const hasCertificate = normalizeHasCertificate(
    firstDefined(raw.hasCertificate, raw.m9)
  );
  const certificateType = asString(
    firstDefined(raw.certificateType, raw.m_certificate_type)
  ) as "link" | "file" | "";
  const proofLink = asString(firstDefined(raw.proofLink, raw.m10));
  const certificateFile = asString(firstDefined(raw.certificateFile, raw.m_file));
  const certificateFileName = asString(
    firstDefined(raw.certificateFileName, raw.m_file_name)
  );

  const keyTakeaways = asString(firstDefined(raw.keyTakeaways, raw.m11));
  const unansweredQuestions = asString(
    firstDefined(raw.unansweredQuestions, raw.m12)
  );
  const enjoyedMost = asString(firstDefined(raw.enjoyedMost, raw.m13));
  const effectivenessRating = normalizeRating(
    firstDefined(raw.effectivenessRating, raw.m14)
  );
  const additionalFeedback = asString(
    firstDefined(raw.additionalFeedback, raw.m15)
  );

  const supportingDocType = asString(raw.supportingDocType) as "link" | "file" | "";
  const supportingDocLink = asString(raw.supportingDocLink);
  const supportingDocFile = asString(raw.supportingDocFile);
  const supportingDocFileName = asString(raw.supportingDocFileName);

  const rawStatus = asString(raw.reviewStatus).toUpperCase();
  const reviewStatus: MoocReviewStatus =
    rawStatus === "APPROVED" ||
    rawStatus === "NEEDS_CHANGES" ||
    rawStatus === "PENDING"
      ? rawStatus
      : "PENDING";
  const reviewerResponse = asString(raw.reviewerResponse);
  const reviewedAt = normalizeDate(raw.reviewedAt);
  const reviewedByName = asString(raw.reviewedByName);
  const reviewedByEmail = asString(raw.reviewedByEmail);
  const reviewedByRole = asString(raw.reviewedByRole);

  let source: MoocSubmission["source"] = "unknown";
  if (raw.source === "legacy-form" || raw.source === "master-template") {
    source = raw.source;
  } else if (raw.email || raw.courseName) {
    source = "legacy-form";
  } else if (raw.m1 || raw.m4) {
    source = "master-template";
  }

  const rawDataPayload = stripNestedRawData(
    isObject(raw.rawData) ? raw.rawData : raw
  );

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
    completionDate,
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
    reviewStatus: reviewStatus || "PENDING",
    reviewerResponse: reviewerResponse || undefined,
    reviewedAt,
    reviewedByName: reviewedByName || undefined,
    reviewedByEmail: reviewedByEmail || undefined,
    reviewedByRole: reviewedByRole || undefined,
    rawData: rawDataPayload,
  };
};

export const loadCachedMoocSubmissions = (): MoocSubmission[] => {
  const normalized = parseRaw().map(normalizeMoocSubmission);
  return sortSubmissions(normalized);
};

export const loadMoocSubmissions = async (): Promise<MoocSubmission[]> => {
  try {
    const response = await api.get("/mooc-submissions");
    const raw = response.data?.data?.submissions;
    const normalized = Array.isArray(raw)
      ? raw.map(normalizeMoocSubmission)
      : [];

    writeCache(normalized, false);
    return sortSubmissions(normalized);
  } catch (error) {
    console.error("Failed to load MOOC submissions from server, using cache", error);
    return loadCachedMoocSubmissions();
  }
};

export const saveMoocSubmissions = (submissions: MoocSubmission[]) => {
  writeCache(submissions, true);
};

export const addMoocSubmission = async (
  input: Record<string, any>
): Promise<MoocSubmission> => {
  try {
    const response = await api.post("/mooc-submissions", input);
    const submission = normalizeMoocSubmission(response.data?.data?.submission ?? input);
    const existing = loadCachedMoocSubmissions().filter((item) => item.id !== submission.id);
    saveMoocSubmissions([submission, ...existing]);
    return submission;
  } catch (error) {
    console.error("Failed to save MOOC submission to server, using local cache", error);
    const submission = normalizeMoocSubmission({
      ...input,
      id: createSubmissionId(),
      submittedAt: new Date().toISOString(),
    });
    const existing = loadCachedMoocSubmissions().filter((item) => item.id !== submission.id);
    saveMoocSubmissions([submission, ...existing]);
    return submission;
  }
};

export const updateMoocSubmissionReview = async (
  submissionId: string,
  review: {
    reviewStatus: MoocReviewStatus;
    reviewerResponse?: string;
    reviewedByName?: string;
    reviewedByEmail?: string;
    reviewedByRole?: string;
  }
): Promise<MoocSubmission | null> => {
  try {
    const response = await api.patch(`/mooc-submissions/${submissionId}/review`, review);
    const updatedSubmission = normalizeMoocSubmission(response.data?.data?.submission);

    const next = loadCachedMoocSubmissions().map((submission) =>
      submission.id === submissionId ? updatedSubmission : submission
    );

    saveMoocSubmissions(next);
    return updatedSubmission;
  } catch (error) {
    console.error("Failed to update review on server, using local cache", error);
    const submissions = loadCachedMoocSubmissions();
    let updatedSubmission: MoocSubmission | null = null;

    const updated = submissions.map((submission) => {
      if (submission.id !== submissionId) return submission;

      updatedSubmission = {
        ...submission,
        reviewStatus: review.reviewStatus,
        reviewerResponse: asString(review.reviewerResponse),
        reviewedAt: new Date().toISOString(),
        reviewedByName: asString(review.reviewedByName) || submission.reviewedByName,
        reviewedByEmail: asString(review.reviewedByEmail) || submission.reviewedByEmail,
        reviewedByRole: asString(review.reviewedByRole) || submission.reviewedByRole,
      };

      return updatedSubmission;
    });

    if (!updatedSubmission) return null;
    saveMoocSubmissions(updated);
    return updatedSubmission;
  }
};

export const moocSubmissionStorageKey = STORAGE_KEY;
export const moocSubmissionUpdateEvent = UPDATE_EVENT;
