# MULTI-LAYER CACHING STRATEGY
## School Growth Hub - 100,000 Concurrent Users

**Phase:** 4 of 11  
**Focus:** Browser, CDN, Application, and Database caching

---

## CACHING ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                        │
│  Layer 1: Browser Cache (HTTP Cache-Control)            │
│  - Static assets: 1 year                                │
│  - API responses: 5-60 minutes                          │
│  - Hit Rate Target: 20-30%                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    CDN (CloudFlare)                      │
│  Layer 2: Edge Cache                                    │
│  - Static files: 24 hours                               │
│  - Public API responses: 1-5 minutes                    │
│  - Hit Rate Target: 40-60%                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  API GATEWAY                             │
│  Layer 3: Gateway Cache (Redis)                         │
│  - Rate limit counters                                  │
│  - Session validation                                   │
│  - Hit Rate Target: 90%+                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              APPLICATION SERVICES                        │
│  Layer 4: Application Cache (Redis Cluster)             │
│  - User profiles: 1 hour                                │
│  - Observations: 5-10 minutes                           │
│  - Goals: 10 minutes                                    │
│  - Documents: 30 minutes                                │
│  - Hit Rate Target: 70-90%                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   DATABASE                               │
│  Layer 5: Query Cache (PostgreSQL)                      │
│  - Prepared statement cache                             │
│  - Query plan cache                                     │
│  - Hit Rate Target: 10-20%                              │
└─────────────────────────────────────────────────────────┘
```

---

## LAYER 1: BROWSER CACHE

### HTTP Cache Headers Strategy

```typescript
// backend/src/middleware/cacheHeaders.ts

export const setCacheHeaders = (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;

  // Static assets (images, CSS, JS) - Cache for 1 year
  if (path.match(/\.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$/)) {
    res.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Expires': new Date(Date.now() + 31536000000).toUTCString()
    });
  }

  // API responses - Short cache with revalidation
  else if (path.startsWith('/api/v1')) {
    const publicEndpoints = ['/api/v1/observations', '/api/v1/goals'];
    
    if (publicEndpoints.some(endpoint => path.startsWith(endpoint))) {
      // Public data - cache for 5 minutes
      res.set({
        'Cache-Control': 'public, max-age=300, must-revalidate',
        'ETag': generateETag(req),
        'Vary': 'Authorization'
      });
    } else {
      // Private data - no cache
      res.set({
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
    }
  }

  next();
};

function generateETag(req: Request): string {
  const content = `${req.path}:${req.query}`;
  return crypto.createHash('md5').update(content).digest('hex');
}
```

### Conditional Requests (304 Not Modified)

```typescript
// backend/src/middleware/conditionalRequest.ts

export const handleConditionalRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ifNoneMatch = req.headers['if-none-match'];
  const currentETag = res.get('ETag');

  if (ifNoneMatch && currentETag && ifNoneMatch === currentETag) {
    // Content hasn't changed, return 304
    return res.status(304).end();
  }

  next();
};
```

---

## LAYER 2: CDN CACHE

### CloudFlare Configuration

```javascript
// cloudflare-workers/cache-rules.js

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const cache = caches.default;

  // Cache key includes query parameters
  const cacheKey = new Request(url.toString(), request);

  // Check cache first
  let response = await cache.match(cacheKey);

  if (!response) {
    // Cache miss - fetch from origin
    response = await fetch(request);

    // Clone response for caching
    const responseToCache = response.clone();

    // Cache based on content type
    if (shouldCache(url, response)) {
      const headers = new Headers(responseToCache.headers);
      
      // Add cache headers
      if (url.pathname.match(/\.(jpg|png|css|js)$/)) {
        headers.set('Cache-Control', 'public, max-age=86400'); // 24 hours
      } else if (url.pathname.startsWith('/api/v1/')) {
        headers.set('Cache-Control', 'public, max-age=60'); // 1 minute
      }

      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers
      });

      event.waitUntil(cache.put(cacheKey, cachedResponse));
    }
  }

  return response;
}

function shouldCache(url, response) {
  // Don't cache errors
  if (response.status >= 400) return false;

  // Don't cache POST/PUT/DELETE
  if (request.method !== 'GET') return false;

  // Cache static assets
  if (url.pathname.match(/\.(jpg|png|css|js|woff|svg)$/)) return true;

  // Cache specific API endpoints
  const cacheableEndpoints = [
    '/api/v1/observations',
    '/api/v1/goals',
    '/api/v1/documents'
  ];

  return cacheableEndpoints.some(endpoint => url.pathname.startsWith(endpoint));
}
```

### CDN Cache Purging

```typescript
// backend/src/services/cdnCacheService.ts

export class CDNCacheService {
  private cloudflareApiKey: string;
  private cloudflareZoneId: string;

  constructor() {
    this.cloudflareApiKey = process.env.CLOUDFLARE_API_KEY!;
    this.cloudflareZoneId = process.env.CLOUDFLARE_ZONE_ID!;
  }

  /**
   * Purge specific URLs from CDN cache
   */
  async purgeUrls(urls: string[]): Promise<void> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.cloudflareZoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.cloudflareApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: urls })
      }
    );

    if (!response.ok) {
      throw new Error(`CDN purge failed: ${response.statusText}`);
    }
  }

  /**
   * Purge all cache (use sparingly)
   */
  async purgeAll(): Promise<void> {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.cloudflareZoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.cloudflareApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ purge_everything: true })
      }
    );

    if (!response.ok) {
      throw new Error(`CDN purge all failed: ${response.statusText}`);
    }
  }
}

// Usage: Purge cache when data changes
async function updateObservation(id: string, data: any) {
  const observation = await prisma.observation.update({
    where: { id },
    data
  });

  // Purge CDN cache for this observation
  const cdnCache = new CDNCacheService();
  await cdnCache.purgeUrls([
    `https://api.example.com/api/v1/observations/${id}`,
    `https://api.example.com/api/v1/observations?teacherId=${observation.teacherId}`
  ]);

  return observation;
}
```

---

## LAYER 3: REDIS CLUSTER SETUP

### Redis Cluster Architecture

```
┌──────────────────────────────────────────────────┐
│           Redis Cluster (6 Nodes)                │
├──────────────────────────────────────────────────┤
│                                                  │
│  Primary 1 (Slots 0-5460)    ←→  Replica 1      │
│  Primary 2 (Slots 5461-10922) ←→  Replica 2     │
│  Primary 3 (Slots 10923-16383) ←→ Replica 3     │
│                                                  │
│  Total Memory: 96 GB (16 GB per node)            │
│  Replication: Async (< 1ms lag)                  │
│  Persistence: AOF + RDB snapshots                │
└──────────────────────────────────────────────────┘
```

### Redis Configuration

```conf
# redis.conf

# Cluster mode
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000

# Memory
maxmemory 16gb
maxmemory-policy allkeys-lru

# Persistence
appendonly yes
appendfsync everysec
save 900 1
save 300 10
save 60 10000

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300
```

### Redis Client Setup

```typescript
// backend/src/infrastructure/cache/redis.ts

import Redis from 'ioredis';

class RedisCluster {
  private client: Redis.Cluster;

  constructor() {
    this.client = new Redis.Cluster(
      [
        { host: 'redis-1.internal', port: 6379 },
        { host: 'redis-2.internal', port: 6379 },
        { host: 'redis-3.internal', port: 6379 }
      ],
      {
        redisOptions: {
          password: process.env.REDIS_PASSWORD,
          enableReadyCheck: true,
          maxRetriesPerRequest: 3
        },
        clusterRetryStrategy: (times) => {
          return Math.min(100 * times, 2000);
        },
        enableOfflineQueue: true,
        enableReadyCheck: false,
        maxRedirections: 16,
        retryDelayOnFailover: 100,
        retryDelayOnClusterDown: 300
      }
    );

    this.client.on('error', (err) => {
      console.error('Redis Cluster Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Cluster Connected');
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.client.setex(key, ttlSeconds, JSON.stringify(value));
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Get remaining TTL
   */
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * Set expiration
   */
  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }
}

export const redis = new RedisCluster();
```

---

## LAYER 4: APPLICATION CACHING PATTERNS

### Cache-Aside Pattern

```typescript
// backend/src/services/userService.ts

export class UserService {
  private readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Get user by ID with caching
   */
  async getUserById(userId: string): Promise<User | null> {
    const cacheKey = `user:${userId}`;

    // 1. Check cache first
    const cached = await redis.get<User>(cacheKey);
    if (cached) {
      console.log(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    console.log(`Cache MISS: ${cacheKey}`);

    // 2. Cache miss - fetch from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        campusId: true,
        department: true
      }
    });

    if (!user) return null;

    // 3. Store in cache
    await redis.set(cacheKey, user, this.CACHE_TTL);

    return user;
  }

  /**
   * Update user and invalidate cache
   */
  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    // 1. Update database
    const user = await prisma.user.update({
      where: { id: userId },
      data
    });

    // 2. Invalidate cache
    await redis.del(`user:${userId}`);

    // 3. Invalidate related caches
    await redis.delPattern(`observations:teacher:${userId}:*`);
    await redis.delPattern(`observations:observer:${userId}:*`);
    await redis.delPattern(`goals:teacher:${userId}:*`);

    return user;
  }
}
```

### Read-Through Cache Pattern

```typescript
// backend/src/infrastructure/cache/cacheManager.ts

export class CacheManager {
  /**
   * Get or fetch pattern
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // Try cache first
    const cached = await redis.get<T>(key);
    if (cached) return cached;

    // Fetch from source
    const value = await fetchFn();

    // Store in cache
    if (value) {
      await redis.set(key, value, ttl);
    }

    return value;
  }
}

// Usage
const cacheManager = new CacheManager();

async function getObservation(id: string): Promise<Observation> {
  return cacheManager.getOrFetch(
    `observation:${id}`,
    () => prisma.observation.findUnique({ where: { id } }),
    600 // 10 minutes
  );
}
```

### Cache Warming Strategy

```typescript
// backend/src/jobs/cacheWarming.ts

export class CacheWarmingJob {
  /**
   * Warm cache for frequently accessed data
   */
  async warmCache(): Promise<void> {
    console.log('Starting cache warming...');

    // 1. Warm user profiles for active users
    const activeUsers = await prisma.user.findMany({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true
      }
    });

    for (const user of activeUsers) {
      await redis.set(`user:${user.id}`, user, 3600);
    }

    console.log(`Warmed ${activeUsers.length} user profiles`);

    // 2. Warm recent observations
    const recentObservations = await prisma.observation.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      take: 1000,
      orderBy: { createdAt: 'desc' }
    });

    for (const obs of recentObservations) {
      await redis.set(`observation:${obs.id}`, obs, 600);
    }

    console.log(`Warmed ${recentObservations.length} observations`);

    // 3. Warm aggregated stats
    const stats = await this.calculateStats();
    await redis.set('dashboard:stats', stats, 300);

    console.log('Cache warming completed');
  }

  private async calculateStats() {
    // Calculate and cache expensive aggregations
    return {
      totalUsers: await prisma.user.count(),
      totalObservations: await prisma.observation.count(),
      totalGoals: await prisma.goal.count()
    };
  }
}

// Schedule cache warming every hour
setInterval(() => {
  new CacheWarmingJob().warmCache();
}, 60 * 60 * 1000);
```

---

## CACHE INVALIDATION STRATEGIES

### Event-Driven Invalidation

```typescript
// backend/src/infrastructure/events/cacheInvalidator.ts

export class CacheInvalidator {
  constructor(private eventBus: EventBus) {
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    // User events
    this.eventBus.subscribe('user.updated', async (event) => {
      const { userId } = event.payload;
      await redis.del(`user:${userId}`);
      await redis.delPattern(`observations:*:${userId}:*`);
      console.log(`Invalidated cache for user ${userId}`);
    });

    // Observation events
    this.eventBus.subscribe('observation.created', async (event) => {
      const { teacherId, observerId } = event.payload;
      await redis.delPattern(`observations:teacher:${teacherId}:*`);
      await redis.delPattern(`observations:observer:${observerId}:*`);
      await redis.del('dashboard:stats');
    });

    this.eventBus.subscribe('observation.updated', async (event) => {
      const { observationId, teacherId } = event.payload;
      await redis.del(`observation:${observationId}`);
      await redis.delPattern(`observations:teacher:${teacherId}:*`);
    });

    // Goal events
    this.eventBus.subscribe('goal.created', async (event) => {
      const { teacherId } = event.payload;
      await redis.delPattern(`goals:teacher:${teacherId}:*`);
      await redis.del('dashboard:stats');
    });

    this.eventBus.subscribe('goal.updated', async (event) => {
      const { goalId, teacherId } = event.payload;
      await redis.del(`goal:${goalId}`);
      await redis.delPattern(`goals:teacher:${teacherId}:*`);
    });
  }
}
```

### Time-Based Invalidation (TTL)

```typescript
// Different TTL for different data types

const CACHE_TTL = {
  USER_PROFILE: 3600,        // 1 hour (changes rarely)
  OBSERVATION: 600,          // 10 minutes (moderate changes)
  GOAL: 600,                 // 10 minutes
  DOCUMENT: 1800,            // 30 minutes (changes rarely)
  ACKNOWLEDGEMENT: 300,      // 5 minutes (changes frequently)
  DASHBOARD_STATS: 300,      // 5 minutes (expensive calculation)
  SESSION: 86400,            // 24 hours
  RATE_LIMIT: 60             // 1 minute
};

// Usage
await redis.set(`user:${userId}`, user, CACHE_TTL.USER_PROFILE);
await redis.set(`observation:${id}`, obs, CACHE_TTL.OBSERVATION);
```

### Proactive Refresh Pattern

```typescript
// backend/src/infrastructure/cache/proactiveRefresh.ts

export class ProactiveRefreshCache {
  /**
   * Get value and refresh if TTL is low
   */
  async getWithRefresh<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number,
    refreshThreshold: number = 300 // 5 minutes
  ): Promise<T> {
    // Get cached value
    const cached = await redis.get<T>(key);

    if (cached) {
      // Check remaining TTL
      const remainingTtl = await redis.ttl(key);

      // If TTL is low, refresh in background
      if (remainingTtl < refreshThreshold) {
        // Don't await - refresh in background
        this.refreshInBackground(key, fetchFn, ttl);
      }

      return cached;
    }

    // Cache miss - fetch and cache
    const value = await fetchFn();
    await redis.set(key, value, ttl);
    return value;
  }

  private async refreshInBackground<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number
  ): Promise<void> {
    try {
      const value = await fetchFn();
      await redis.set(key, value, ttl);
      console.log(`Proactively refreshed cache: ${key}`);
    } catch (error) {
      console.error(`Failed to refresh cache: ${key}`, error);
    }
  }
}
```

---

## CACHE MONITORING

### Cache Hit Rate Tracking

```typescript
// backend/src/infrastructure/cache/cacheMetrics.ts

export class CacheMetrics {
  private hits = 0;
  private misses = 0;

  recordHit() {
    this.hits++;
  }

  recordMiss() {
    this.misses++;
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? (this.hits / total) * 100 : 0;
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
  }

  getMetrics() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
      total: this.hits + this.misses
    };
  }
}

export const cacheMetrics = new CacheMetrics();

// Expose metrics endpoint
app.get('/metrics/cache', (req, res) => {
  res.json(cacheMetrics.getMetrics());
});
```

### Redis Monitoring

```typescript
// backend/src/infrastructure/cache/redisMonitor.ts

export class RedisMonitor {
  async getStats() {
    const info = await redis.client.info();
    
    return {
      connectedClients: this.parseInfo(info, 'connected_clients'),
      usedMemory: this.parseInfo(info, 'used_memory_human'),
      totalKeys: await redis.client.dbsize(),
      hitRate: this.calculateHitRate(info),
      evictedKeys: this.parseInfo(info, 'evicted_keys'),
      expiredKeys: this.parseInfo(info, 'expired_keys')
    };
  }

  private parseInfo(info: string, key: string): string {
    const match = info.match(new RegExp(`${key}:(.+)`));
    return match ? match[1].trim() : 'N/A';
  }

  private calculateHitRate(info: string): number {
    const hits = parseInt(this.parseInfo(info, 'keyspace_hits'));
    const misses = parseInt(this.parseInfo(info, 'keyspace_misses'));
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 0;
  }
}
```

---

## CACHE BEST PRACTICES

### ✅ DO

1. **Cache frequently accessed data**
   - User profiles
   - Recent observations
   - Dashboard statistics

2. **Use appropriate TTL**
   - Short TTL for frequently changing data
   - Long TTL for static data

3. **Invalidate on updates**
   - Delete cache when data changes
   - Use event-driven invalidation

4. **Monitor cache hit rate**
   - Target: 70-90% hit rate
   - Alert if hit rate drops below 60%

5. **Use cache keys consistently**
   - Pattern: `{entity}:{id}` (e.g., `user:123`)
   - Pattern: `{entity}:{filter}:{page}` (e.g., `observations:teacher:123:page:1`)

### ❌ DON'T

1. **Don't cache sensitive data without encryption**
2. **Don't cache for too long** (stale data)
3. **Don't cache everything** (memory waste)
4. **Don't forget to invalidate** (data inconsistency)
5. **Don't cache errors** (propagates failures)

---

## PERFORMANCE TARGETS

| Metric | Target |
|--------|--------|
| Cache Hit Rate (Application) | 70-90% |
| Cache Hit Rate (CDN) | 40-60% |
| Cache Hit Rate (Browser) | 20-30% |
| Redis Response Time (P95) | < 5ms |
| Redis Response Time (P99) | < 10ms |
| Cache Memory Usage | < 80% |
| Cache Eviction Rate | < 1% |

---

## NEXT PHASE

Continue to **API_REDESIGN.md** for API contracts and versioning strategy.
