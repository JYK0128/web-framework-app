import { Inject, Injectable } from '@nestjs/common';

import { type IKvStoreAdapter, KV_STORE_ADAPTER } from './kv-store.interface';

@Injectable()
export class KvStore implements IKvStoreAdapter {
  constructor(
    @Inject(KV_STORE_ADAPTER)
    private readonly adapter: IKvStoreAdapter,
  ) {}

  get name(): string {
    return this.adapter.name;
  }

  get<T = string>(key: string): Promise<T | null> {
    return this.adapter.get<T>(key);
  }

  getAndDelete<T = string>(key: string): Promise<T | null> {
    return this.adapter.getAndDelete<T>(key);
  }

  set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    return this.adapter.set(key, value, ttlSeconds);
  }

  setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    return this.adapter.setIfAbsent(key, value, ttlSeconds);
  }

  setOrThrow(key: string, value: string, ttlSeconds?: number): Promise<void> {
    return this.adapter.setOrThrow(key, value, ttlSeconds);
  }

  del(key: string): Promise<void> {
    return this.adapter.del(key);
  }

  exists(key: string): Promise<boolean> {
    return this.adapter.exists(key);
  }

  hSet(key: string, fieldOrRecord: string | Record<string, string>, value?: string): Promise<number> {
    return this.adapter.hSet(key, fieldOrRecord, value);
  }

  hGetAll(key: string): Promise<Record<string, string>> {
    return this.adapter.hGetAll(key);
  }
}
