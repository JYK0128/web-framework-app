import type { RedisClientOptions } from 'redis';

export const KV_ADAPTER = Symbol('KV_ADAPTER');
export const KV_STORE_MODULE_OPTIONS = Symbol('KV_STORE_MODULE_OPTIONS');

export interface IncrementWithBlockResult {
  value: number
  remainingTtlMilliseconds: number
  blocked: boolean
  blockedTtlMilliseconds: number
}

export interface KvAdapter {
  readonly name: string

  get<T = string>(key: string): Promise<T | null>
  getAndDelete<T = string>(key: string): Promise<T | null>
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>
  setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean>
  setOrThrow(key: string, value: string, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  delIfValue(key: string, value: string): Promise<boolean>
  increment(key: string): Promise<number>
  expire(key: string, ttlSeconds: number): Promise<boolean>
  getTtlSeconds(key: string): Promise<number | null>
  incrementWithBlock(counterKey: string, blockKey: string, ttlMilliseconds: number, limit: number, blockDurationMilliseconds: number): Promise<IncrementWithBlockResult>
  exists(key: string): Promise<boolean>
  hSet(key: string, fieldOrRecord: string | Record<string, string>, value?: string): Promise<number>
  hGetAll(key: string): Promise<Record<string, string>>
  hDel(key: string, field: string): Promise<void>
  ping(): Promise<boolean>
}

export type KvStoreDriver = 'in-memory' | 'redis';

export interface KvStoreModuleOptions {
  driver?: KvStoreDriver
  redis?: RedisClientOptions
}
