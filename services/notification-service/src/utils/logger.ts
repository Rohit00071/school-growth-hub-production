export const logger = {
    info: (message: string, meta?: any) => console.log(`[INFO] [notification-service] ${message}`, meta || ''),
    error: (message: string, meta?: any) => console.error(`[ERROR] [notification-service] ${message}`, meta || ''),
    warn: (message: string, meta?: any) => console.warn(`[WARN] [notification-service] ${message}`, meta || ''),
};
