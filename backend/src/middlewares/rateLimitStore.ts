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

const LUA_INCR_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
`;

export class UpstashRateLimitStore {
  windowMs: number;
  prefix: string;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
    this.prefix = `rl:${Math.random().toString(36).slice(2, 8)}:`;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const r = getRedis();
    const fullKey = `${this.prefix}${key}`;
    if (r) {
      try {
        return await this.redisIncrement(r, fullKey);
      } catch {
        return this.memoryIncrement(fullKey);
      }
    }
    return this.memoryIncrement(fullKey);
  }

  private async redisIncrement(r: Redis, key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const ttlSeconds = Math.ceil(this.windowMs / 1000);
    const result = await r.eval(LUA_INCR_SCRIPT, [key], [ttlSeconds.toString()]);
    const count = typeof result === 'number' ? result : Number(result);

    const ttlRaw = await r.ttl(key);
    const ttl = typeof ttlRaw === 'number' ? ttlRaw : 0;
    const resetTime = new Date(Date.now() + Math.max(ttl, 0) * 1000);
    return { totalHits: count, resetTime };
  }

  private memoryIncrement(key: string): { totalHits: number; resetTime: Date } {
    const now = Date.now();
    this.evictExpired();
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
    const fullKey = `${this.prefix}${key}`;
    const r = getRedis();
    if (r) {
      try {
        await r.decr(fullKey);
        return;
      } catch {
        // fall through to memory
      }
    }
    const record = memoryStore.get(fullKey);
    if (record && record.count > 0) {
      record.count--;
    }
  }

  async resetKey(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    const r = getRedis();
    if (r) {
      try {
        await r.del(fullKey);
        return;
      } catch {
        // fall through to memory
      }
    }
    memoryStore.delete(fullKey);
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, record] of memoryStore) {
      if (now >= record.expires) {
        memoryStore.delete(key);
      }
    }
  }
}