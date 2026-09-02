import { Injectable, Logger } from '@nestjs/common';
import { jsonSafeParse } from '@pkg/shared/common';

import type { IKvStoreAdapter } from '#/infra/kv-store/kv-store.interface';

interface MemoryStoreItem {
  value: string
  expiresAt?: number
}

@Injectable()
export class InMemoryKvStoreAdapter implements IKvStoreAdapter {
  readonly name = 'in-memory';
  private readonly logger = new Logger(InMemoryKvStoreAdapter.name);
  private readonly store = new Map<string, MemoryStoreItem>();
  private readonly hashStore = new Map<string, Map<string, string>>();

  async get<T = string>(key: string): Promise<T | null> {
    const item = this.getValidItem(key);
    if (!item) return null;
    return this.deserialize<T>(item.value);
  }

  async getAndDelete<T = string>(key: string): Promise<T | null> {
    const value = await this.get<T>(key);
    this.store.delete(key);
    return value;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = this.serialize(value);
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value: serialized, expiresAt });
  }

  async setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const existing = this.getValidItem(key);
    if (existing) {
      return false;
    }
    const expiresAt = Date.now() + Math.max(1, ttlSeconds) * 1000;
    this.store.set(key, { value, expiresAt });
    return true;
  }

  async setOrThrow(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const acquired = await this.setIfAbsent(key, value, ttlSeconds ?? 0);
    if (!acquired) {
      throw new Error(`KvStore key already exists: ${key}`);
    }
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
    this.hashStore.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.getValidItem(key) !== null;
  }

  async hSet(key: string, fieldOrRecord: string | Record<string, string>, value?: string): Promise<number> {
    let hash = this.hashStore.get(key);
    if (!hash) {
      hash = new Map<string, string>();
      this.hashStore.set(key, hash);
    }

    let addedCount = 0;
    if (typeof fieldOrRecord === 'object') {
      for (const [field, val] of Object.entries(fieldOrRecord)) {
        if (!hash.has(field)) addedCount += 1;
        hash.set(field, val);
      }
    }
    else {
      if (!hash.has(fieldOrRecord)) addedCount += 1;
      hash.set(fieldOrRecord, value ?? '');
    }

    return addedCount;
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    const hash = this.hashStore.get(key);
    if (!hash) return {};
    return Object.fromEntries(hash.entries());
  }

  private getValidItem(key: string): MemoryStoreItem | null {
    const item = this.store.get(key);
    if (!item) return null;

    if (item.expiresAt && item.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return item;
  }

  private serialize(value: unknown): string {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }

  private deserialize<T>(value: string): T | null {
    return jsonSafeParse<T>(value);
  }
}
