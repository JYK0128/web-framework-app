import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { type AuthKvRecords, KvStoreKey } from '#/infra/kv-store/kv-store.helper';
import { KvStore } from '#/infra/kv-store/kv-store.service';

import { type TokenConsumeResult, type TokenStore } from './token.store';

@Injectable()
export class RedisTokenStore implements TokenStore {
  constructor(private readonly kvStore: KvStore) {}

  private hashRefreshToken(token: string): string { return createHash('sha256').update(token).digest('hex'); }

  async storeToken(token: string, record: AuthKvRecords['refreshToken'], ttlSeconds: number): Promise<void> {
    const hash = this.hashRefreshToken(token);
    await this.kvStore.set(KvStoreKey.auth.refreshToken(hash), record, ttlSeconds);
    await this.kvStore.set(KvStoreKey.auth.refreshFamily(record.familyId), hash, ttlSeconds);
    await this.kvStore.hSet(KvStoreKey.auth.userFamilies(record.sub), record.familyId, '1');
  }

  async consumeToken(token: string): Promise<TokenConsumeResult> {
    const hash = this.hashRefreshToken(token);
    const record = await this.kvStore.getAndDelete<AuthKvRecords['refreshToken']>(KvStoreKey.auth.refreshToken(hash));
    if (record) {
      const remainingSeconds = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));
      await this.kvStore.setIfAbsent(KvStoreKey.auth.refreshTokenUsed(hash), record.familyId, remainingSeconds);
      return { status: 'success', record };
    }
    const familyId = await this.kvStore.get<AuthKvRecords['refreshTokenUsed']>(KvStoreKey.auth.refreshTokenUsed(hash));
    if (!familyId) return { status: 'fail', reason: 'not-found' };
    await this.revokeTokenFamily(familyId);
    return { status: 'fail', reason: 'reused' };
  }

  async revokeToken(token: string): Promise<void> {
    const hash = this.hashRefreshToken(token);
    const record = await this.kvStore.get<AuthKvRecords['refreshToken']>(KvStoreKey.auth.refreshToken(hash));
    if (record) await this.revokeTokenFamily(record.familyId);
  }

  async revokeTokenFamily(familyId: string): Promise<void> {
    const currentHash = await this.kvStore.get<string>(KvStoreKey.auth.refreshFamily(familyId));
    if (currentHash) {
      const record = await this.kvStore.get<AuthKvRecords['refreshToken']>(KvStoreKey.auth.refreshToken(currentHash));
      await this.kvStore.del(KvStoreKey.auth.refreshToken(currentHash));
      if (record) await this.kvStore.hDel(KvStoreKey.auth.userFamilies(record.sub), familyId);
    }
    await this.kvStore.del(KvStoreKey.auth.refreshFamily(familyId));
  }

  async listUserTokens(userId: string): Promise<AuthKvRecords['refreshToken'][]> {
    const familyIds = Object.keys(await this.kvStore.hGetAll(KvStoreKey.auth.userFamilies(userId)));
    const records = await Promise.all(familyIds.map(async (familyId) => {
      const hash = await this.kvStore.get<string>(KvStoreKey.auth.refreshFamily(familyId));
      const record = hash ? await this.kvStore.get<AuthKvRecords['refreshToken']>(KvStoreKey.auth.refreshToken(hash)) : null;
      if (!record || record.sub !== userId || record.expiresAt <= Date.now()) {
        await this.kvStore.hDel(KvStoreKey.auth.userFamilies(userId), familyId);
        return null;
      }
      return record;
    }));
    return records.filter((record): record is AuthKvRecords['refreshToken'] => Boolean(record));
  }

  async revokeUserTokens(userId: string): Promise<void> {
    const families = Object.keys(await this.kvStore.hGetAll(KvStoreKey.auth.userFamilies(userId)));
    await Promise.all(families.map((familyId) => this.revokeTokenFamily(familyId)));
    await this.kvStore.del(KvStoreKey.auth.userFamilies(userId));
  }

  async ping(): Promise<boolean> { return this.kvStore.ping(); }
}
