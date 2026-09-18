import { Injectable } from '@nestjs/common';
import type { JWTPayload } from 'jose';

import { KvStoreKey } from '#/infra/kv-store/kv-store.helper';
import { KvStore } from '#/infra/kv-store/kv-store.service';

@Injectable()
export class TokenStoreService {
  private readonly TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days sliding

  constructor(private readonly kvStore: KvStore) {}

  async store(token: string, payload: JWTPayload | Record<string, unknown>, ttlSeconds?: number): Promise<void> {
    const key = KvStoreKey.auth.token(token);
    await this.kvStore.set(key, payload, ttlSeconds ?? this.TOKEN_TTL_SECONDS);
  }

  async get(token: string): Promise<JWTPayload | null> {
    const key = KvStoreKey.auth.token(token);
    return this.kvStore.get<JWTPayload>(key);
  }

  async touch(token: string): Promise<void> {
    const payload = await this.get(token);
    if (payload) {
      await this.store(token, payload, this.TOKEN_TTL_SECONDS);
    }
  }

  async revoke(token: string): Promise<void> {
    const key = KvStoreKey.auth.token(token);
    await this.kvStore.del(key);
  }

  async ping(): Promise<boolean> {
    return this.kvStore.ping();
  }
}
