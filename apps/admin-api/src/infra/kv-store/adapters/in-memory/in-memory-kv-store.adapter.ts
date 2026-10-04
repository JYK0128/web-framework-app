import { Injectable, Logger } from '@nestjs/common';
import { jsonSafeParse, valueIf } from '@pkg/shared/common';

import type { IKvStoreAdapter, IncrementWithBlockResult } from '#/infra/kv-store/kv-store.interface';

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
    const expiresAt = valueIf(Boolean(ttlSeconds && ttlSeconds > 0), Date.now() + (ttlSeconds ?? 0) * 1000);
    this.store.set(key, { value: serialized, expiresAt });
  }

  async setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const existing = this.getValidItem(key);
    if (existing) {
      return false;
    }
    const expiresAt = Date.now() + Math.max(1, ttlSeconds) * 1000;
    this.store.set(key, { value: this.serialize(value), expiresAt });
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

  async delIfValue(key: string, value: string): Promise<boolean> {
    const item = this.getValidItem(key);
    if (!item || item.value !== this.serialize(value)) return false;
    this.store.delete(key);
    return true;
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const item = this.getValidItem(key);
    if (!item) return false;
    item.expiresAt = Date.now() + Math.max(1, ttlSeconds) * 1000;
    return true;
  }

  async getTtlSeconds(key: string): Promise<number | null> {
    const item = this.getValidItem(key);
    if (!item) return null;
    return item.expiresAt === undefined ? null : Math.max(0, Math.ceil((item.expiresAt - Date.now()) / 1000));
  }

  async incrementWithBlock(counterKey: string, blockKey: string, ttlMilliseconds: number, limit: number, blockDurationMilliseconds: number): Promise<IncrementWithBlockResult> {
    const now = Date.now();
    const block = this.getValidItem(blockKey);
    if (block) {
      return {
        value: limit + 1,
        remainingTtlMilliseconds: Math.max(0, (block.expiresAt ?? now) - now),
        blocked: true,
        blockedTtlMilliseconds: Math.max(0, (block.expiresAt ?? now) - now),
      };
    }

    const counter = this.getValidItem(counterKey);
    const recentHits = counter?.value.split(',').map(Number).filter((timestamp) => now - timestamp < ttlMilliseconds) ?? [];
    recentHits.push(now);
    const value = recentHits.length;
    const expiresAt = recentHits[0] + Math.max(1, ttlMilliseconds);
    const blocked = value > limit;
    const blockExpiresAt = blocked ? now + Math.max(1, blockDurationMilliseconds) : now;
    if (blocked) {
      this.store.delete(counterKey);
      this.store.set(blockKey, { value: '1', expiresAt: blockExpiresAt });
    }
    else {
      this.store.set(counterKey, { value: recentHits.join(','), expiresAt: now + Math.max(1, ttlMilliseconds) });
    }

    return {
      value,
      remainingTtlMilliseconds: Math.max(0, expiresAt - now),
      blocked,
      blockedTtlMilliseconds: Math.max(0, blockExpiresAt - now),
    };
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

  async hDel(key: string, field: string): Promise<void> {
    const hash = this.hashStore.get(key);
    if (!hash) return;
    hash.delete(field);
    if (hash.size === 0) this.hashStore.delete(key);
  }

  async ping(): Promise<boolean> {
    return true;
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
    const serialized = JSON.stringify(value);
    if (typeof serialized !== 'string') {
      throw new Error('KvStore value cannot be serialized');
    }
    return serialized;
  }

  private deserialize<T>(value: string): T | null {
    return jsonSafeParse<T>(value);
  }
}
