import { Inject, Injectable, Logger, type OnModuleDestroy, type OnModuleInit, Optional } from '@nestjs/common';
import { createClient, type RedisClientType } from 'redis';

import { env } from '#/env';

export const REDIS_MODULE_OPTIONS = Symbol('REDIS_MODULE_OPTIONS');

export interface RedisModuleOptions {
  url?: string
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: RedisClientType;
  private isConnected = false;

  constructor(
    @Optional()
    @Inject(REDIS_MODULE_OPTIONS)
    private readonly options?: RedisModuleOptions,
  ) {}

  async onModuleInit(): Promise<void> {
    const url = this.options?.url || env.REDIS_URL;
    this.client = createClient({ url });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err instanceof Error ? err.message : String(err)}`);
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Redis connected successfully');
    });

    try {
      await this.client.connect();
    }
    catch (err) {
      this.logger.warn(`Failed to connect to Redis on startup: ${err instanceof Error ? err.message : String(err)}. Cache will fallback or retry on demand.`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client?.isOpen) {
      try {
        await this.client.quit();
        this.logger.log('Redis connection closed gracefully');
      }
      catch (err) {
        this.logger.error(`Error closing Redis connection: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async get<T = string>(key: string): Promise<T | null> {
    try {
      const val = await this.client.get(key);
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

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, serialized, { EX: ttlSeconds });
      }
      else {
        await this.client.set(key, serialized);
      }
    }
    catch (err) {
      this.logger.error(`Redis set error for key "${key}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    }
    catch (err) {
      this.logger.error(`Redis del error for key "${key}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const count = await this.client.exists(key);
      return count > 0;
    }
    catch (err) {
      this.logger.error(`Redis exists error for key "${key}": ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }
}
