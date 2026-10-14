import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { type RefreshToken, type TokenConsumeResult, TokenStore } from '@pkg/server-core/auth/user/token/stores/token.store';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';

import { SERVICE_ID } from '#/app.config';

@Injectable()
export class RedisTokenStore extends TokenStore {
  constructor(private readonly kvStore: KvStore) { super(); }

  private key(name: string): string { return `${SERVICE_ID}:auth_token:${name}`; }
  private roleFamilies(roleId: string): string { return this.key(`role_families:${roleId}`); }
  private hash(token: string): string { return createHash('sha256').update(token).digest('hex'); }

  override async storeToken(token: string, record: RefreshToken, retentionTtlSeconds: number, familyTtlSeconds: number): Promise<void> {
    const hash = this.hash(token);
    await this.kvStore.set(this.key(`refresh:${hash}`), record, retentionTtlSeconds);
    await this.kvStore.set(this.key(`family:${record.familyId}`), hash, familyTtlSeconds);
    await this.addFamily(this.key(`user_families:${record.sub}`), record.familyId, familyTtlSeconds);
    if (record.roleId) {
      const previousRoleId = await this.kvStore.get<string>(this.key(`family_role:${record.familyId}`));
      if (previousRoleId && previousRoleId !== record.roleId) await this.kvStore.hDel(this.roleFamilies(previousRoleId), record.familyId);
      await this.kvStore.set(this.key(`family_role:${record.familyId}`), record.roleId, familyTtlSeconds);
      await this.addFamily(this.roleFamilies(record.roleId), record.familyId, familyTtlSeconds);
    }
  }

  private async addFamily(indexKey: string, familyId: string, ttlSeconds: number): Promise<void> {
    await this.kvStore.hSet(indexKey, familyId, '1');
    const currentTtl = await this.kvStore.getTtlSeconds(indexKey);
    await this.kvStore.expire(indexKey, Math.max(currentTtl ?? 0, ttlSeconds));
  }

  override async consumeToken(token: string): Promise<TokenConsumeResult> {
    const hash = this.hash(token);
    const record = await this.kvStore.getAndDelete<RefreshToken>(this.key(`refresh:${hash}`));
    if (record) {
      const ttl = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));
      await this.kvStore.setIfAbsent(this.key(`refresh_used:${hash}`), record.familyId, ttl);
      const currentHash = await this.kvStore.get<string>(this.key(`family:${record.familyId}`));
      if (currentHash !== hash || record.expiresAt <= Date.now()) {
        await this.revokeTokenFamily(record.familyId);
        await this.kvStore.hDel(this.key(`user_families:${record.sub}`), record.familyId);
        return { reason: 'not-found' };
      }
      return { record };
    }
    const familyId = await this.kvStore.get<string>(this.key(`refresh_used:${hash}`));
    if (!familyId) return { reason: 'not-found' };
    await this.revokeTokenFamily(familyId);
    return { reason: 'reused' };
  }

  override async revokeToken(token: string): Promise<void> {
    const hash = this.hash(token);
    const record = await this.kvStore.get<RefreshToken>(this.key(`refresh:${hash}`));
    if (record) await this.revokeTokenFamily(record.familyId);
  }

  override async revokeTokenFamily(familyId: string): Promise<void> {
    const familyKey = this.key(`family:${familyId}`);
    const hash = await this.kvStore.get<string>(familyKey);
    if (hash) {
      const record = await this.kvStore.get<RefreshToken>(this.key(`refresh:${hash}`));
      await this.kvStore.del(this.key(`refresh:${hash}`));
      if (record) await this.kvStore.hDel(this.key(`user_families:${record.sub}`), familyId);
    }
    const roleId = await this.kvStore.get<string>(this.key(`family_role:${familyId}`));
    if (roleId) await this.kvStore.hDel(this.roleFamilies(roleId), familyId);
    await this.kvStore.del(this.key(`family_role:${familyId}`));
    await this.kvStore.del(familyKey);
  }

  override async listUserTokens(userId: string): Promise<RefreshToken[]> {
    const familyIds = Object.keys(await this.kvStore.hGetAll(this.key(`user_families:${userId}`)));
    const records = await Promise.all(familyIds.map(async (familyId) => {
      const familyKey = this.key(`family:${familyId}`);
      const hash = await this.kvStore.get<string>(familyKey);
      const record = hash ? await this.kvStore.get<RefreshToken>(this.key(`refresh:${hash}`)) : null;
      const ttl = await this.kvStore.getTtlSeconds(familyKey);
      if (!record || record.sub !== userId || record.expiresAt <= Date.now() || ttl === null) {
        await this.kvStore.hDel(this.key(`user_families:${userId}`), familyId);
        return null;
      }
      return { ...record, expiresAt: Math.min(record.expiresAt, Date.now() + ttl * 1000) };
    }));
    return records.filter((record): record is RefreshToken => Boolean(record));
  }

  override async revokeUserTokens(userId: string): Promise<void> {
    const familyIds = Object.keys(await this.kvStore.hGetAll(this.key(`user_families:${userId}`)));
    await Promise.all(familyIds.map((familyId) => this.revokeTokenFamily(familyId)));
    await this.kvStore.del(this.key(`user_families:${userId}`));
  }

  override async revokeRoleTokens(roleId: string): Promise<void> {
    const familyIds = Object.keys(await this.kvStore.hGetAll(this.roleFamilies(roleId)));
    await Promise.all(familyIds.map((familyId) => this.revokeTokenFamily(familyId)));
    await this.kvStore.del(this.roleFamilies(roleId));
  }
}
