import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';

import { KvStore } from './kv-store.service';

@Injectable()
export class KvStoreThrottlerStorage implements ThrottlerStorage {
  constructor(
    private readonly kvStore: KvStore,
    private readonly keyPrefix: string,
  ) {}

  async increment(key: string, ttl: number, limit: number, blockDuration: number, throttlerName: string) {
    const counterKey = `throttle:v2:${this.keyPrefix}:${throttlerName}:${key}`;
    const result = await this.kvStore.incrementWithBlock(
      counterKey,
      `${counterKey}:blocked`,
      ttl,
      limit,
      blockDuration,
    );
    return {
      totalHits: result.value,
      timeToExpire: Math.ceil(result.remainingTtlMilliseconds / 1000),
      isBlocked: result.blocked,
      timeToBlockExpire: Math.ceil(result.blockedTtlMilliseconds / 1000),
    };
  }
}
