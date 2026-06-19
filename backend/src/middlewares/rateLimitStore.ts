import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
    return redis;
  }
  return null;
}

interface StoreRecord {
  count: number;
  expires: number;
}

const memoryStore = new Map<string, StoreRecord>();

export class UpstashRateLimitStore {
  windowMs: number;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const r = getRedis();
    if (r) {
      return this.redisIncrement(r, key);
    }
    return this.memoryIncrement(key);
  }

  private async redisIncrement(r: Redis, key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const results = await r
      .multi()
      .incr(key)
      .expire(key, Math.ceil(this.windowMs / 1000))
      .exec<{ result: number }[]>();

    const count = results[0].result as number;
    const resetTime = new Date(Date.now() + this.windowMs);
    return { totalHits: count, resetTime };
  }

  private memoryIncrement(key: string): { totalHits: number; resetTime: Date } {
    const now = Date.now();
    const record = memoryStore.get(key);

    if (!record || now >= record.expires) {
      const expires = now + this.windowMs;
      memoryStore.set(key, { count: 1, expires });
      return { totalHits: 1, resetTime: new Date(expires) };
    }

    record.count++;
    return { totalHits: record.count, resetTime: new Date(record.expires) };
  }

  async decrement(key: string): Promise<void> {
    const r = getRedis();
    if (r) {
      await r.decr(key);
      return;
    }
    const record = memoryStore.get(key);
    if (record && record.count > 0) {
      record.count--;
    }
  }

  async resetKey(key: string): Promise<void> {
    const r = getRedis();
    if (r) {
      await r.del(key);
      return;
    }
    memoryStore.delete(key);
  }
}