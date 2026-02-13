export const logger = {
    info: (message: string, meta?: any) => console.log(`[INFO] [observation-service] ${message}`, meta || ''),
    error: (message: string, meta?: any) => console.error(`[ERROR] [observation-service] ${message}`, meta || ''),
    warn: (message: string, meta?: any) => console.warn(`[WARN] [observation-service] ${message}`, meta || ''),
};
