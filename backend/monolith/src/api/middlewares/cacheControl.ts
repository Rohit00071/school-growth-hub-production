import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Cache Control Middleware
 * Implements HTTP cache headers for performance optimization
 * 
 * Strategy:
 * 1. Static assets: Long cache (1 year)
 * 2. Public API data: Short cache (5 mins)
 * 3. Private API data: No cache (security)
 */
export const cacheControl = (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        res.set('Cache-Control', 'no-store');
        return next();
    }

    const path = req.path;

    // 1. Static Assets (Images, Fonts, CSS, JS)
    // Cache for 1 year, immutable
    if (path.match(/\.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$/)) {
        res.set({
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Expires': new Date(Date.now() + 31536000000).toUTCString()
        });
        return next();
    }

    // 2. API Endpoints
    if (path.startsWith('/api/v1')) {
        // Public/Shared Data - Cache for 5 minutes
        // Examples: School list, public definitions, configuration
        const publicEndpoints = [
            '/api/v1/config',
            '/api/v1/public'
        ];

        if (publicEndpoints.some(endpoint => path.startsWith(endpoint))) {
            const etag = generateETag(req);

            // Check If-None-Match header
            if (req.headers['if-none-match'] === etag) {
                return res.status(304).end();
            }

            res.set({
                'Cache-Control': 'public, max-age=300, must-revalidate',
                'ETag': etag,
                'Vary': 'Accept-Encoding'
            });
            return next();
        }

        // Private User Data - No Store
        // Security first: Don't cache sensitive user data in browser/proxies
        // Rely on application-level caching (Redis) instead
        res.set({
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        return next();
    }

    // Default: No cache
    res.set('Cache-Control', 'no-store');
    next();
};

/**
 * Generate ETag based on request path and query
 * Simple implementation - for better results, hash the response body
 */
function generateETag(req: Request): string {
    const content = `${req.path}:${JSON.stringify(req.query)}`;
    return crypto.createHash('md5').update(content).digest('hex');
}
