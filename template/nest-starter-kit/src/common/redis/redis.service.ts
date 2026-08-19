import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit, Optional } from '@nestjs/common';
import { createClient, type RedisClientType, WatchError } from 'redis';

import { env } from '#/env';

export const REDIS_MODULE_OPTIONS = Symbol('REDIS_MODULE_OPTIONS');

export interface RedisModuleOptions {
  url?: string
}

export type RedisTransactionWrite = {
  key: string
  value: string
  ttlSeconds?: number
};

export type RedisTransactionContext = {
  get(key: string): Promise<string | null>
};

export type RedisTransactionPlan<T> = {
  result: T
  writes?: readonly RedisTransactionWrite[]
};

const MAX_OPTIMISTIC_ATTEMPTS = 5;
const OPTIMISTIC_RETRY_DELAY_MS = 5;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType | null = null;

  constructor(
    @Optional()
    @Inject(REDIS_MODULE_OPTIONS)
    private readonly options?: RedisModuleOptions,
  ) {}

  // Connection lifecycle
  async onModuleInit(): Promise<void> {
    if (this.client?.isOpen) return;

    const url = this.options?.url || env.REDIS_URL;
    this.client = createClient({ url });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err instanceof Error ? err.message : String(err)}`);
    });

    this.client.on('ready', () => {
      this.logger.log('Redis connected successfully');
    });

    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    const client = this.client;
    this.client = null;

    if (client?.isOpen) {
      try {
        await client.quit();
        this.logger.log('Redis connection closed gracefully');
      }
      catch (err) {
        this.logger.error(`Error closing Redis connection: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // Cache operations
  async get<T = string>(key: string): Promise<T | null> {
    try {
      const val = await this.getReadyClient().get(key);
      if (!val) return null;
      try {
        return JSON.parse(val) as T;
      }
      catch {
        return val as unknown as T;
      }
    }
    catch (err) {
      this.logger.error(`Redis get error for key "${key}": ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  async getAndDelete<T = string>(key: string): Promise<T | null> {
    const val = await this.getReadyClient().getDel(key);
    if (!val) return null;
    try {
      return JSON.parse(val) as T;
    }
    catch {
      return val as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const client = this.getReadyClient();
      const serialized = this.serialize(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await client.set(key, serialized, { EX: ttlSeconds });
      }
      else {
        await client.set(key, serialized);
      }
    }
    catch (err) {
      this.logger.error(`Redis set error for key "${key}": ${err instanceof Error ? err.message : String(err)}`);
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
    const client = this.getReadyClient();
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(key, value, { EX: ttlSeconds });
      return;
    }
    await client.set(key, value);
  }

  async del(key: string): Promise<void> {
    try {
      await this.getReadyClient().del(key);
    }
    catch (err) {
      this.logger.error(`Redis del error for key "${key}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.getReadyClient().exists(key);
    return count > 0;
  }

  // Transaction operations
  async withTransaction<T>(
    callback: (transaction: RedisTransactionContext) => Promise<RedisTransactionPlan<T>>,
  ): Promise<T> {
    const client = this.getReadyClient().duplicate();
    client.on('error', (err) => {
      this.logger.error(`Redis transaction connection error: ${err instanceof Error ? err.message : String(err)}`);
    });

    try {
      await client.connect();
      const plan = await callback({
        get: (key) => client.get(key),
      });

      if (plan.writes?.length) {
        const transaction = client.multi();
        for (const write of plan.writes) {
          if (write.ttlSeconds && write.ttlSeconds > 0) {
            transaction.set(write.key, write.value, { EX: write.ttlSeconds });
          }
          else {
            transaction.set(write.key, write.value);
          }
        }
        await transaction.exec();
      }

      return plan.result;
    }
    finally {
      if (client.isOpen) await client.quit();
    }
  }

  async withOptimisticTransaction<T>(
    keys: readonly string[],
    callback: (transaction: RedisTransactionContext) => Promise<RedisTransactionPlan<T>>,
  ): Promise<T> {
    const client = this.getReadyClient().duplicate();
    client.on('error', (err) => {
      this.logger.error(`Redis transaction connection error: ${err instanceof Error ? err.message : String(err)}`);
    });

    try {
      await client.connect();
      const executeWrites = async (writes: readonly RedisTransactionWrite[]): Promise<void> => {
        const transaction = client.multi();
        for (const write of writes) {
          if (write.ttlSeconds && write.ttlSeconds > 0) {
            transaction.set(write.key, write.value, { EX: write.ttlSeconds });
          }
          else {
            transaction.set(write.key, write.value);
          }
        }
        await transaction.exec();
      };

      for (let attempt = 0; attempt < MAX_OPTIMISTIC_ATTEMPTS; attempt += 1) {
        try {
          await client.watch([...keys]);
          const plan = await callback({
            get: (key) => client.get(key),
          });

          if (!plan.writes?.length) {
            await client.unwatch();
            return plan.result;
          }

          await executeWrites(plan.writes);
          return plan.result;
        }
        catch (error) {
          if (!(error instanceof WatchError)) throw error;
          if (attempt < MAX_OPTIMISTIC_ATTEMPTS - 1) {
            const delay = OPTIMISTIC_RETRY_DELAY_MS * (attempt + 1);
            await new Promise<void>((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    }
    finally {
      if (client.isOpen) await client.quit();
    }

    throw new Error('Redis optimistic transaction conflicted');
  }

  // helper methods
  private serialize(value: unknown): string {
    if (typeof value === 'string') return value;

    const serialized = JSON.stringify(value) as string | undefined;
    if (!serialized) throw new Error('Redis value cannot be serialized');
    return serialized;
  }

  private getReadyClient(): RedisClientType {
    const client = this.client;
    if (!client?.isReady) {
      throw new Error('Redis is not ready');
    }
    return client;
  }
}
