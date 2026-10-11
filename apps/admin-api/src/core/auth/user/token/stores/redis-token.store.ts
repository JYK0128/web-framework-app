import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { SERVICE_ID } from '#/app.config';
import { type RefreshToken, type TokenConsumeResult, type TokenStore } from '#/core/auth/user/token/stores/token.store';
import { KvStore } from '#/core/kv-store/kv-store.service';

const RedisTokenKey = {
  refreshToken: (hash: string) => `${SERVICE_ID}:auth_token:refresh:${hash}`,
  refreshTokenUsed: (hash: string) => `${SERVICE_ID}:auth_token:refresh_used:${hash}`,
  refreshFamily: (familyId: string) => `${SERVICE_ID}:auth_token:refresh_family:${familyId}`,
  userFamilies: (userId: string) => `${SERVICE_ID}:auth_token:user_families:${userId}`,
} as const;

@Injectable()
export class RedisTokenStore implements TokenStore {
  constructor(private readonly kvStore: KvStore) {}

  private hashRefreshToken(token: string): string { return createHash('sha256').update(token).digest('hex'); }

  async storeToken(token: string, record: RefreshToken, retentionTtlSeconds: number, familyTtlSeconds: number): Promise<void> {
    const hash = this.hashRefreshToken(token);
    await this.kvStore.set(RedisTokenKey.refreshToken(hash), record, retentionTtlSeconds);
    await this.kvStore.set(RedisTokenKey.refreshFamily(record.familyId), hash, familyTtlSeconds);
    await this.kvStore.hSet(RedisTokenKey.userFamilies(record.sub), record.familyId, '1');
  }

  async consumeToken(token: string): Promise<TokenConsumeResult> {
    const hash = this.hashRefreshToken(token);
    const record = await this.kvStore.getAndDelete<RefreshToken>(RedisTokenKey.refreshToken(hash));
    if (record) {
      const remainingSeconds = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));
      await this.kvStore.setIfAbsent(RedisTokenKey.refreshTokenUsed(hash), record.familyId, remainingSeconds);
      const currentHash = await this.kvStore.get<string>(RedisTokenKey.refreshFamily(record.familyId));
      if (currentHash !== hash || record.expiresAt <= Date.now()) {
        await this.revokeTokenFamily(record.familyId);
        await this.kvStore.hDel(RedisTokenKey.userFamilies(record.sub), record.familyId);
        return { reason: 'not-found' };
      }
      return { record };
    }
    const familyId = await this.kvStore.get<string>(RedisTokenKey.refreshTokenUsed(hash));
    if (!familyId) return { reason: 'not-found' };
    await this.revokeTokenFamily(familyId);
    return { reason: 'reused' };
  }

  async revokeToken(token: string): Promise<void> {
    const hash = this.hashRefreshToken(token);
    const record = await this.kvStore.get<RefreshToken>(RedisTokenKey.refreshToken(hash));
    if (record) await this.revokeTokenFamily(record.familyId);
  }

  async revokeTokenFamily(familyId: string): Promise<void> {
    const currentHash = await this.kvStore.get<string>(RedisTokenKey.refreshFamily(familyId));
    if (currentHash) {
      const record = await this.kvStore.get<RefreshToken>(RedisTokenKey.refreshToken(currentHash));
      await this.kvStore.del(RedisTokenKey.refreshToken(currentHash));
      if (record) await this.kvStore.hDel(RedisTokenKey.userFamilies(record.sub), familyId);
    }
    await this.kvStore.del(RedisTokenKey.refreshFamily(familyId));
  }

  async listUserTokens(userId: string): Promise<RefreshToken[]> {
    const familyIds = Object.keys(await this.kvStore.hGetAll(RedisTokenKey.userFamilies(userId)));
    const records = await Promise.all(familyIds.map(async (familyId) => {
      const familyKey = RedisTokenKey.refreshFamily(familyId);
      const hash = await this.kvStore.get<string>(familyKey);
      const record = hash ? await this.kvStore.get<RefreshToken>(RedisTokenKey.refreshToken(hash)) : null;
      const ttlSeconds = await this.kvStore.getTtlSeconds(familyKey);
      if (!record || record.sub !== userId || record.expiresAt <= Date.now() || ttlSeconds === null) {
        await this.kvStore.hDel(RedisTokenKey.userFamilies(userId), familyId);
        return null;
      }
      return { ...record, expiresAt: Math.min(record.expiresAt, Date.now() + ttlSeconds * 1000) };
    }));
    return records.filter((record): record is RefreshToken => Boolean(record));
  }

  async revokeUserTokens(userId: string): Promise<void> {
    const families = Object.keys(await this.kvStore.hGetAll(RedisTokenKey.userFamilies(userId)));
    await Promise.all(families.map((familyId) => this.revokeTokenFamily(familyId)));
    await this.kvStore.del(RedisTokenKey.userFamilies(userId));
  }

  async ping(): Promise<boolean> { return this.kvStore.ping(); }
}
