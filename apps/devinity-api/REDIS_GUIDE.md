# Redis Integration Guide

This guide explains how Redis is integrated into the Devinity API and how to use it effectively.

## Overview

Redis has been integrated into the application with two approaches:

1. **Cache Manager** - High-level caching abstraction (recommended for most use cases)
2. **Direct Redis Client** - Low-level access for advanced Redis operations

## Setup

### 1. Environment Variables

Add these variables to your `.env.local` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=       # Optional, leave empty for local development
REDIS_DB=0            # Default Redis database (0-15)
```

### 2. Start Redis

Using Docker Compose:

```bash
docker-compose up -d redis
```

This will start Redis on port 6379 with data persistence enabled.

### 3. Install Dependencies

Dependencies are already added to `package.json`. Install them:

```bash
pnpm install
```

## Usage Examples

### Using Cache Manager (Recommended)

The Cache Manager provides a simple, high-level API for caching:

```typescript
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class MyService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getData(id: string) {
    const cacheKey = `data:${id}`;

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const data = await this.fetchFromDatabase(id);

    // Store in cache for 5 minutes (300000ms)
    await this.cacheManager.set(cacheKey, data, 300000);

    return data;
  }

  async invalidateCache(id: string) {
    await this.cacheManager.del(`data:${id}`);
  }
}
```

### Using Direct Redis Client (Advanced)

For advanced Redis operations like counters, sets, sorted sets, etc.:

```typescript
import { REDIS_CLIENT } from "../db/redis.tokens";
import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class MyService {
  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {}

  // Increment counter
  async incrementCounter(key: string): Promise<number> {
    const count = await this.redis.incr(key);
    await this.redis.expire(key, 3600); // 1 hour TTL
    return count;
  }

  // Store with expiry
  async setWithExpiry(key: string, value: string, seconds: number) {
    await this.redis.setex(key, seconds, value);
  }

  // Use Redis Sets
  async addToSet(setKey: string, member: string) {
    await this.redis.sadd(setKey, member);
  }

  async getSetMembers(setKey: string): Promise<string[]> {
    return await this.redis.smembers(setKey);
  }

  // Use Redis Sorted Sets (leaderboards, etc.)
  async addToSortedSet(key: string, score: number, member: string) {
    await this.redis.zadd(key, score, member);
  }

  async getTopFromSortedSet(key: string, count: number) {
    return await this.redis.zrevrange(key, 0, count - 1, "WITHSCORES");
  }
}
```

## Common Patterns

### 1. Cache-Aside Pattern

The most common caching pattern:

```typescript
async getData(id: string) {
  // 1. Check cache
  const cached = await this.cacheManager.get(`key:${id}`);
  if (cached) return cached;

  // 2. Fetch from source
  const data = await this.fetchData(id);

  // 3. Store in cache
  await this.cacheManager.set(`key:${id}`, data, TTL);

  return data;
}
```

### 2. Cache Invalidation

Always invalidate cache when data changes:

```typescript
async updateData(id: string, newData: any) {
  // 1. Update database
  await this.db.update(id, newData);

  // 2. Invalidate cache
  await this.cacheManager.del(`key:${id}`);
  await this.cacheManager.del(`list:all`);
}
```

### 3. Rate Limiting

Using Redis for rate limiting:

```typescript
async checkRateLimit(userId: string, limit: number, window: number): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const count = await this.redis.incr(key);

  if (count === 1) {
    await this.redis.expire(key, window);
  }

  return count <= limit;
}
```

### 4. Session Storage

Store temporary session data:

```typescript
async storeSession(sessionId: string, data: any, ttlSeconds: number) {
  await this.redis.setex(
    `session:${sessionId}`,
    ttlSeconds,
    JSON.stringify(data)
  );
}

async getSession(sessionId: string): Promise<any | null> {
  const data = await this.redis.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}
```

## Best Practices

### 1. Key Naming Convention

Use a hierarchical naming structure:

- `users:all` - List of all users
- `user:{id}` - Single user by ID
- `user:{id}:posts` - User's posts
- `user:{id}:login_count` - User login counter

### 2. Set Appropriate TTLs

Always set expiration times to prevent memory bloat:

- Short-lived data: 5-10 minutes
- Medium-lived data: 1 hour
- Long-lived data: 24 hours
- Counters: Based on your rate limit window

### 3. Cache Serialization

Cache Manager automatically serializes/deserializes JSON. For direct Redis:

```typescript
// Storing objects
await this.redis.set("key", JSON.stringify(object));

// Retrieving objects
const data = await this.redis.get("key");
const object = JSON.parse(data);
```

### 4. Error Handling

Always handle Redis errors gracefully:

```typescript
async getCachedData(key: string) {
  try {
    return await this.cacheManager.get(key);
  } catch (error) {
    this.logger.error('Redis error:', error);
    // Fall back to database
    return await this.fetchFromDatabase();
  }
}
```

### 5. Batch Operations

Use pipelines for multiple operations:

```typescript
async batchSet(items: Array<{ key: string; value: string }>) {
  const pipeline = this.redis.pipeline();

  items.forEach(({ key, value }) => {
    pipeline.setex(key, 3600, value);
  });

  await pipeline.exec();
}
```

## Monitoring

### Check Redis Connection

```bash
# Connect to Redis CLI
docker exec -it devinity-api-redis-1 redis-cli

# Check connection
PING

# View all keys
KEYS *

# Get a value
GET users:all

# Check TTL
TTL users:all

# View Redis info
INFO
```

### Monitor Cache Hit Rates

Add logging to track cache effectiveness:

```typescript
async getData(id: string) {
  const cached = await this.cacheManager.get(key);
  if (cached) {
    this.logger.log(`Cache HIT for ${key}`);
    return cached;
  }

  this.logger.log(`Cache MISS for ${key}`);
  // ... fetch from database
}
```

## Performance Considerations

1. **Cache size**: Monitor Redis memory usage
2. **Eviction policy**: Redis is configured with `appendonly` for persistence
3. **Network latency**: Redis should be on the same network as your API
4. **Serialization overhead**: Large objects may be expensive to serialize

## Troubleshooting

### Redis Connection Failed

```bash
# Check if Redis is running
docker ps | grep redis

# Check logs
docker logs devinity-api-redis-1

# Restart Redis
docker-compose restart redis
```

### Cache Not Working

1. Check environment variables are set correctly
2. Verify Redis is running: `docker ps`
3. Check application logs for Redis errors
4. Try connecting to Redis CLI to verify it's accessible

### Clear All Cache

```bash
# Connect to Redis
docker exec -it devinity-api-redis-1 redis-cli

# Clear all keys in current database
FLUSHDB

# Clear all databases
FLUSHALL
```

## See Also

- [ioredis Documentation](https://github.com/redis/ioredis)
- [NestJS Caching](https://docs.nestjs.com/techniques/caching)
- [Redis Commands](https://redis.io/commands)
