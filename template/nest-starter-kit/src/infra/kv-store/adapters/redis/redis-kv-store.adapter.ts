import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { createClient } from 'redis';

import { type IKvStoreAdapter, KV_STORE_MODULE_OPTIONS, type KvStoreModuleOptions } from '#/infra/kv-store/kv-store.interface';

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

    client.on('ready', () => {
      this.logger.log('[KvStore:redis] Connected successfully');
    });

    try {
      await client.connect();
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
        this.logger.log('[KvStore:redis] Connection closed gracefully');
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

  private serialize(value: unknown): string {
    if (typeof value === 'string') return value;
    const serialized = JSON.stringify(value);
    if (typeof serialized !== 'string') {
      throw new Error('KvStore value cannot be serialized');
    }
    return serialized;
  }

  private deserialize<T>(value: string): T | null {
    return JSON.safeParse<T | null>(value, null);
  }

  private getReadyClient(): ReturnType<typeof createClient> {
    const client = this.client;
    if (!client?.isReady) {
      throw new Error('KvStore Redis client is not ready');
    }
    return client;
  }
}
