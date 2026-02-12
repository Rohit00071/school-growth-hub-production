import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

// Mock Prisma
vi.mock('../config/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn()
        }
    }
}));

describe('Auth API', () => {
    it('should return 401 if accessing protected route without token', async () => {
        const res = await request(app).get('/api/v1/users/me');
        expect(res.status).toBe(401);
    });

    it('should return 400 for invalid registration data', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({ email: 'invalid-email' });

        expect(res.status).toBe(400);
        expect(res.body.status).toBe('error');
    });
});
