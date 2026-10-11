import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { type RefreshToken, type TokenConsumeResult, type TokenStore } from '#/core/auth/user/token/stores/token.store';
import { RefreshToken as RefreshTokenEntity } from '#/core/database/entities/auth/refresh-token.entity';
import { AppEntityManager } from '#/core/database/entity-manager';

@Injectable()
export class DatabaseTokenStore implements TokenStore {
  constructor(private readonly em: AppEntityManager) {}

  async storeToken(token: string, record: RefreshToken, _retentionTtlSeconds: number, familyTtlSeconds: number): Promise<void> {
    const entity = this.em.create(RefreshTokenEntity, { user: record.sub, tokenHash: this.hash(token), familyId: record.familyId, rememberMe: record.rememberMe, expiresAt: new Date(record.expiresAt), idleExpiresAt: new Date(Date.now() + familyTtlSeconds * 1000) });
    this.em.persist(entity);
    await this.em.flush();
  }

  async consumeToken(token: string): Promise<TokenConsumeResult> {
    const entity = await this.em.findOne(RefreshTokenEntity, { tokenHash: this.hash(token) }, { populate: ['user'] });
    if (!entity) return { reason: 'not-found' };
    const now = new Date();
    if (entity.usedAt) {
      await this.revokeTokenFamily(entity.familyId);
      return { reason: 'reused' };
    }
    if (entity.revokedAt || entity.expiresAt <= now || entity.idleExpiresAt <= now) {
      await this.revokeTokenFamily(entity.familyId);
      return { reason: 'not-found' };
    }
    const updated = await this.em.nativeUpdate(
      RefreshTokenEntity,
      { id: entity.id, usedAt: null, revokedAt: null, expiresAt: { $gt: now }, idleExpiresAt: { $gt: now } },
      { usedAt: now },
    );
    if (updated === 0) {
      await this.revokeTokenFamily(entity.familyId);
      return { reason: 'reused' };
    }
    return { record: this.toRecord(entity) };
  }

  async revokeToken(token: string): Promise<void> {
    const entity = await this.em.findOne(RefreshTokenEntity, { tokenHash: this.hash(token) });
    if (entity) await this.revokeTokenFamily(entity.familyId);
  }

  async revokeTokenFamily(familyId: string): Promise<void> {
    await this.em.nativeUpdate(RefreshTokenEntity, { familyId, revokedAt: null }, { revokedAt: new Date() });
  }

  async listUserTokens(userId: string): Promise<RefreshToken[]> {
    const now = new Date();
    const entities = await this.em.find(RefreshTokenEntity, { user: userId, revokedAt: null, usedAt: null, expiresAt: { $gt: now }, idleExpiresAt: { $gt: now } }, { populate: ['user'] });
    return entities.map((entity) => ({ ...this.toRecord(entity), expiresAt: Math.min(entity.expiresAt.getTime(), entity.idleExpiresAt.getTime()) }));
  }

  async revokeUserTokens(userId: string): Promise<void> {
    await this.em.nativeUpdate(RefreshTokenEntity, { user: userId, revokedAt: null }, { revokedAt: new Date() });
  }

  private hash(token: string): string { return createHash('sha256').update(token).digest('hex'); }

  private toRecord(entity: RefreshTokenEntity): RefreshToken {
    return { sub: entity.user.id, rememberMe: entity.rememberMe, familyId: entity.familyId, expiresAt: entity.expiresAt.getTime() };
  }
}
