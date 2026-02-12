export const logger = {
    info: (message: string, meta?: any) => console.log(`[INFO] [analytics-service] ${message}`, meta || ''),
    error: (message: string, meta?: any) => console.error(`[ERROR] [analytics-service] ${message}`, meta || ''),
    warn: (message: string, meta?: any) => console.warn(`[WARN] [analytics-service] ${message}`, meta || ''),
};
