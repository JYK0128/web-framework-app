import type { RedisClientOptions } from 'redis';

export const KV_STORE_ADAPTER = Symbol('KV_STORE_ADAPTER');
export const KV_STORE_MODULE_OPTIONS = Symbol('KV_STORE_MODULE_OPTIONS');

export interface IKvStoreAdapter {
  readonly name: string

  get<T = string>(key: string): Promise<T | null>
  getAndDelete<T = string>(key: string): Promise<T | null>
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>
  setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean>
  setOrThrow(key: string, value: string, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  hSet(key: string, fieldOrRecord: string | Record<string, string>, value?: string): Promise<number>
  hGetAll(key: string): Promise<Record<string, string>>
}

export type KvStoreDriver = 'in-memory' | 'redis';

export interface KvStoreModuleOptions {
  driver?: KvStoreDriver
  redis?: RedisClientOptions
}
