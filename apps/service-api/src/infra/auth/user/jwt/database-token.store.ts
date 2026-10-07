import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { RefreshToken } from '#/entities/auth/refresh-token.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { type AuthKvRecords } from '#/infra/kv-store/kv-store.helper';

import { type TokenConsumeResult, type TokenStore } from './token.store';

@Injectable()
export class DatabaseTokenStore implements TokenStore {
  constructor(private readonly em: AppEntityManager) {}

  async storeToken(token: string, record: AuthKvRecords['refreshToken'], _retentionTtlSeconds: number, sessionTtlSeconds: number): Promise<void> {
    const entity = this.em.create(RefreshToken, { user: record.sub, tokenHash: this.hash(token), familyId: record.familyId, rememberMe: record.rememberMe, expiresAt: new Date(record.expiresAt), idleExpiresAt: new Date(Date.now() + sessionTtlSeconds * 1000) });
    this.em.persist(entity);
    await this.em.flush();
  }

  async consumeToken(token: string): Promise<TokenConsumeResult> {
    const entity = await this.em.findOne(RefreshToken, { tokenHash: this.hash(token) }, { populate: ['user'] });
    if (!entity) return { status: 'fail', reason: 'not-found' };
    const now = new Date();
    if (entity.usedAt) {
      await this.revokeTokenFamily(entity.familyId);
      return { status: 'fail', reason: 'reused' };
    }
    if (entity.revokedAt || entity.expiresAt <= now || entity.idleExpiresAt <= now) {
      await this.revokeTokenFamily(entity.familyId);
      return { status: 'fail', reason: 'not-found' };
    }
    const updated = await this.em.nativeUpdate(
      RefreshToken,
      { id: entity.id, usedAt: null, revokedAt: null, expiresAt: { $gt: now }, idleExpiresAt: { $gt: now } },
      { usedAt: now },
    );
    if (updated === 0) {
      await this.revokeTokenFamily(entity.familyId);
      return { status: 'fail', reason: 'reused' };
    }
    return { status: 'success', record: this.toRecord(entity) };
  }

  async touchFamily(familyId: string, sessionTtlSeconds: number): Promise<boolean> {
    const now = new Date();
    const result = await this.em.nativeUpdate(
      RefreshToken,
      { familyId, usedAt: null, revokedAt: null, expiresAt: { $gt: now }, idleExpiresAt: { $gt: now } },
      { idleExpiresAt: new Date(now.getTime() + sessionTtlSeconds * 1000) },
    );
    if (result > 0) return true;
    const consumedDuringRefresh = await this.em.findOne(RefreshToken, {
      familyId,
      usedAt: { $ne: null },
      revokedAt: null,
      expiresAt: { $gt: now },
      idleExpiresAt: { $gt: now },
    });
    return Boolean(consumedDuringRefresh);
  }

  async revokeToken(token: string): Promise<void> {
    const entity = await this.em.findOne(RefreshToken, { tokenHash: this.hash(token) });
    if (entity) await this.revokeTokenFamily(entity.familyId);
  }

  async revokeTokenFamily(familyId: string): Promise<void> {
    await this.em.nativeUpdate(RefreshToken, { familyId, revokedAt: null }, { revokedAt: new Date() });
  }

  async listUserTokens(userId: string): Promise<AuthKvRecords['refreshToken'][]> {
    const now = new Date();
    const entities = await this.em.find(RefreshToken, { user: userId, revokedAt: null, usedAt: null, expiresAt: { $gt: now }, idleExpiresAt: { $gt: now } }, { populate: ['user'] });
    return entities.map((entity) => ({ ...this.toRecord(entity), expiresAt: Math.min(entity.expiresAt.getTime(), entity.idleExpiresAt.getTime()) }));
  }

  async revokeUserTokens(userId: string): Promise<void> {
    await this.em.nativeUpdate(RefreshToken, { user: userId, revokedAt: null }, { revokedAt: new Date() });
  }

  private hash(token: string): string { return createHash('sha256').update(token).digest('hex'); }

  private toRecord(entity: RefreshToken): AuthKvRecords['refreshToken'] {
    return { sub: entity.user.id, rememberMe: entity.rememberMe, familyId: entity.familyId, expiresAt: entity.expiresAt.getTime() };
  }
}
