export const logger = {
    info: (message: string, meta?: any) => console.log(`[INFO] [document-service] ${message}`, meta || ''),
    error: (message: string, meta?: any) => console.error(`[ERROR] [document-service] ${message}`, meta || ''),
    warn: (message: string, meta?: any) => console.warn(`[WARN] [document-service] ${message}`, meta || ''),
};
