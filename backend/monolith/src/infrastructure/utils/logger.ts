/**
 * Structured Logger for Enterprise Scalability
 * Uses JSON format for easy ingestion by ELK/Splunk
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private env: string;

    constructor() {
        this.env = process.env.NODE_ENV || 'development';
    }

    private format(level: LogLevel, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();

        if (this.env === 'development') {
            // Readable format for local dev
            const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
            return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
        }

        // JSON format for production
        return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta
        });
    }

    info(message: string, meta?: any) {
        console.log(this.format('info', message, meta));
    }

    warn(message: string, meta?: any) {
        console.warn(this.format('warn', message, meta));
    }

    error(message: string, error?: any) {
        const meta = error instanceof Error ? {
            ...error,
            name: error.name,
            message: error.message,
            stack: error.stack
        } : error;

        console.error(this.format('error', message, meta));
    }

    debug(message: string, meta?: any) {
        if (process.env.DEBUG) {
            console.debug(this.format('debug', message, meta));
        }
    }
}

export const logger = new Logger();
