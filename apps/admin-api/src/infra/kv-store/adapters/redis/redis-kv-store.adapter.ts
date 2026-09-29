import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { jsonSafeParse } from '@pkg/shared/common';
import { createClient } from 'redis';

import { type IKvStoreAdapter, type IncrementWithBlockResult, KV_STORE_MODULE_OPTIONS, type KvStoreModuleOptions } from '#/infra/kv-store/kv-store.interface';

const INCREMENT_WITH_BLOCK_SCRIPT = `
redis.replicate_commands()
if redis.call('EXISTS', KEYS[2]) == 1 then
  local blockTtl = math.max(0, redis.call('PTTL', KEYS[2]))
  return { tonumber(ARGV[2]) + 1, blockTtl, 1, blockTtl }
end

local now = redis.call('TIME')
local nowMilliseconds = tonumber(now[1]) * 1000 + math.floor(tonumber(now[2]) / 1000)
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', nowMilliseconds - ttl)
local current = redis.call('ZCARD', KEYS[1])
local member = tostring(nowMilliseconds) .. ':' .. tostring(current + 1)
redis.call('ZADD', KEYS[1], nowMilliseconds, member)
current = current + 1
redis.call('PEXPIRE', KEYS[1], ttl)
local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
local timeToExpire = math.max(0, tonumber(oldest[2]) + ttl - nowMilliseconds)
if current > tonumber(ARGV[2]) then
  redis.call('SET', KEYS[2], 1, 'PX', ARGV[3])
  redis.call('DEL', KEYS[1])
  return { current, timeToExpire, 1, tonumber(ARGV[3]) }
end
return { current, timeToExpire, 0, 0 }
`;

@Injectable()
export class RedisKvStoreAdapter implements IKvStoreAdapter, OnModuleInit, OnModuleDestroy {
  readonly name = 'redis';
  private readonly logger = new Logger(RedisKvStoreAdapter.name);
  private client: ReturnType<typeof createClient> | null = null;

  constructor(
    @Inject(KV_STORE_MODULE_OPTIONS)
    private readonly options: KvStoreModuleOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.client?.isOpen) return;
    if (!this.options.redis) {
      throw new Error('Redis options must be provided when using RedisKvStoreAdapter');
    }

    const client = createClient(this.options.redis);
    this.client = client;

    client.on('error', (err) => {
      this.logger.error(`[KvStore:redis] Connection error: ${err instanceof Error ? err.message : String(err)}`);
    });

    try {
      await client.connect();
      this.logger.log('[KvStore:redis] Connected successfully.');
    }
    catch (err) {
      this.client = null;
      this.logger.error(`[KvStore:redis] Failed to connect: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    const client = this.client;
    this.client = null;

    if (client?.isOpen) {
      try {
        await client.quit();
        this.logger.log('[KvStore:redis] Connection closed gracefully.');
      }
      catch (err) {
        this.logger.error(`[KvStore:redis] Error closing connection: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  async get<T = string>(key: string): Promise<T | null> {
    const val = await this.getReadyClient().get(key);
    if (!val) return null;
    return this.deserialize<T>(val);
  }

  async getAndDelete<T = string>(key: string): Promise<T | null> {
    const val = await this.getReadyClient().getDel(key);
    if (!val) return null;
    return this.deserialize<T>(val);
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const client = this.getReadyClient();
    const serialized = this.serialize(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(key, serialized, { EX: ttlSeconds });
    }
    else {
      await client.set(key, serialized);
    }
  }

  async setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.getReadyClient().set(key, value, {
      EX: Math.max(1, ttlSeconds),
      NX: true,
    });
    return result === 'OK';
  }

  async setOrThrow(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const result = await this.getReadyClient().set(key, value, {
      ...(ttlSeconds && ttlSeconds > 0 ? { EX: ttlSeconds } : {}),
      NX: true,
    });
    if (result !== 'OK') {
      throw new Error(`Redis key already exists: ${key}`);
    }
  }

  async del(key: string): Promise<void> {
    await this.getReadyClient().del(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    return (await this.getReadyClient().expire(key, Math.max(1, ttlSeconds))) === 1;
  }

  async getTtlSeconds(key: string): Promise<number | null> {
    const ttl = await this.getReadyClient().ttl(key);
    return ttl < 0 ? null : ttl;
  }

  async incrementWithBlock(counterKey: string, blockKey: string, ttlMilliseconds: number, limit: number, blockDurationMilliseconds: number): Promise<IncrementWithBlockResult> {
    const result = await this.getReadyClient().eval(INCREMENT_WITH_BLOCK_SCRIPT, {
      keys: [counterKey, blockKey],
      arguments: [String(Math.max(1, Math.floor(ttlMilliseconds))), String(limit), String(Math.max(1, Math.floor(blockDurationMilliseconds)))],
    }) as number[];
    return {
      value: Number(result[0]),
      remainingTtlMilliseconds: Number(result[1]),
      blocked: Number(result[2]) === 1,
      blockedTtlMilliseconds: Number(result[3]),
    };
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.getReadyClient().exists(key);
    return count > 0;
  }

  async hSet(key: string, fieldOrRecord: string | Record<string, string>, value?: string): Promise<number> {
    const client = this.getReadyClient();
    if (typeof fieldOrRecord === 'object') {
      return client.hSet(key, fieldOrRecord);
    }
    return client.hSet(key, fieldOrRecord, value ?? '');
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return this.getReadyClient().hGetAll(key);
  }

  async hDel(key: string, field: string): Promise<void> {
    await this.getReadyClient().hDel(key, field);
  }

  async ping(): Promise<boolean> {
    try {
      const client = this.getReadyClient();
      const res = await client.ping();
      return res === 'PONG';
    }
    catch {
      return false;
    }
  }

  private serialize(value: unknown): string {
    if (typeof value === 'string') return value;
    const serialized = JSON.stringify(value);
    if (typeof serialized !== 'string') {
      throw new Error('KvStore value cannot be serialized');
    }
    return serialized;
  }

  private deserialize<T>(value: string): T | null {
    return jsonSafeParse<T>(value);
  }

  private getReadyClient(): ReturnType<typeof createClient> {
    const client = this.client;
    if (!client?.isReady) {
      throw new Error('KvStore Redis client is not ready');
    }
    return client;
  }
}
