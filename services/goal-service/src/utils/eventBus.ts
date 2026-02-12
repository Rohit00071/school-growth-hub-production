import { redis } from './redis';
import { logger } from './logger';
import Redis from 'ioredis';

export const EVENT_CHANNELS = {
    OBSERVATION_CREATED: 'observation_created',
    GOAL_CREATED: 'goal_created',
    DOCUMENT_ACKNOWLEDGED: 'document_acknowledged',
    USER_DELETED: 'user_deleted',
};

export class EventBus {
    private subscriber: Redis | null = null;
    private handlers: Map<string, (data: any) => Promise<void> | void> = new Map();

    async publish(channel: string, data: any) {
        try {
            const client = redis.getClient();
            // Only publish if connected
            if ((client as any).status === 'ready') {
                const message = JSON.stringify(data);
                await client.publish(channel, message);
                logger.info(`[Event] Published to ${channel}`);
            } else {
                logger.warn(`[Event] Skip publish to ${channel} - Redis not ready`);
            }
        } catch (error) {
            logger.error(`[Event] Failed to publish to ${channel}`, error);
        }
    }

    async subscribe(channel: string, handler: (data: any) => Promise<void> | void) {
        try {
            if (!this.subscriber) {
                this.subscriber = redis.getClient().duplicate();

                // CRITICAL: Add error handler to prevent process crash
                this.subscriber.on('error', (err) => {
                    logger.error(`[Event] Subscriber Error: ${err.message}`);
                });

                // Listen for messages
                this.subscriber.on('message', (chan, msg) => {
                    this.handleMessage(chan, msg);
                });

                if (this.subscriber.status !== 'ready' && this.subscriber.status !== 'connecting') {
                    await this.subscriber.connect().catch(e => logger.warn('[Event] Subscriber connect failed', e.message));
                }
            }

            // Register handler
            this.handlers.set(channel, handler);

            // Subscribe to channel only if ready
            if (this.subscriber.status === 'ready' || this.subscriber.status === 'connecting') {
                await this.subscriber.subscribe(channel).catch(e => logger.error(`[Event] Subscribe to ${channel} failed`, e.message));
                logger.info(`[Event] Subscribed to ${channel}`);
            }
        } catch (error: any) {
            logger.error(`[Event] Subscribe error for ${channel}`, error.message);
        }
    }

    private async handleMessage(channel: string, message: string) {
        const handler = this.handlers.get(channel);
        if (handler) {
            try {
                const data = JSON.parse(message);
                await handler(data);
            } catch (error) {
                logger.error(`[Event] Failed to process message from ${channel}`, error);
            }
        }
    }
}

export const eventBus = new EventBus();
