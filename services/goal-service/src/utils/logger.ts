export const logger = {
    info: (message: string, meta?: any) => console.log(`[INFO] [goal-service] ${message}`, meta || ''),
    error: (message: string, meta?: any) => console.error(`[ERROR] [goal-service] ${message}`, meta || ''),
    warn: (message: string, meta?: any) => console.warn(`[WARN] [goal-service] ${message}`, meta || ''),
};
