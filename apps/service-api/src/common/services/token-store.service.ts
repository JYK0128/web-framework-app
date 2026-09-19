import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { type AuthKvRecords, KvStoreKey } from '#/infra/kv-store/kv-store.helper';
import { KvStore } from '#/infra/kv-store/kv-store.service';

type RefreshTokenConsumeResult
  = | { status: 'success', record: AuthKvRecords['refreshToken'] }
    | { status: 'fail', reason: 'reused' | 'not-found' };

@Injectable()
export class TokenStoreService {
  constructor(private readonly kvStore: KvStore) {}

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async storeRefreshToken(token: string, record: AuthKvRecords['refreshToken'], ttlSeconds: number): Promise<void> {
    const hash = this.hashRefreshToken(token);
    await this.kvStore.set(KvStoreKey.auth.refreshToken(hash), record, ttlSeconds);
    await this.kvStore.set(KvStoreKey.auth.refreshFamily(record.familyId), hash, ttlSeconds);
  }

  async consumeRefreshToken(token: string): Promise<RefreshTokenConsumeResult> {
    const hash = this.hashRefreshToken(token);
    const record = await this.kvStore.getAndDelete<AuthKvRecords['refreshToken']>(KvStoreKey.auth.refreshToken(hash));
    if (record) {
      const remainingSeconds = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));
      await this.kvStore.setIfAbsent(
        KvStoreKey.auth.refreshTokenUsed(hash),
        record.familyId,
        remainingSeconds,
      );
      return { status: 'success', record };
    }

    const familyId = await this.kvStore.get<AuthKvRecords['refreshTokenUsed']>(KvStoreKey.auth.refreshTokenUsed(hash));
    if (!familyId) return { status: 'fail', reason: 'not-found' };
    await this.revokeRefreshTokenFamily(familyId);
    return { status: 'fail', reason: 'reused' };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const hash = this.hashRefreshToken(token);
    const record = await this.kvStore.get<AuthKvRecords['refreshToken']>(KvStoreKey.auth.refreshToken(hash));
    if (record) await this.revokeRefreshTokenFamily(record.familyId);
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    const currentHash = await this.kvStore.get<string>(KvStoreKey.auth.refreshFamily(familyId));
    if (currentHash) await this.kvStore.del(KvStoreKey.auth.refreshToken(currentHash));
    await this.kvStore.del(KvStoreKey.auth.refreshFamily(familyId));
  }

  async ping(): Promise<boolean> {
    return this.kvStore.ping();
  }
}
