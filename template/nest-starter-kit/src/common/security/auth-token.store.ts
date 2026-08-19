import { Injectable } from '@nestjs/common';

import { RedisService } from '#/common/redis/redis.service';

import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from './auth-token.constants';

const REFRESH_TOKEN_ACTIVE_PREFIX = 'active:';

export class AuthTokenStoreError extends Error {
  constructor(message = 'Auth token operation failed') {
    super(message);
    this.name = AuthTokenStoreError.name;
  }
}

@Injectable()
export class AuthTokenStore {
  constructor(private readonly redis: RedisService) {}

  async registerRefresh(jti: string, tokenFamilyId: string): Promise<void> {
    const registered = await this.redis.setIfAbsent(
      this.refreshTokenKey(jti),
      REFRESH_TOKEN_ACTIVE_PREFIX + tokenFamilyId,
      REFRESH_TOKEN_TTL_SECONDS,
    );
    if (!registered) throw new AuthTokenStoreError('Refresh token registration failed');
  }

  async rotateRefresh(
    jti: string,
    tokenFamilyId: string,
    nextJti: string,
    previousTokenTtl: number,
  ): Promise<void> {
    const refreshTokenKey = this.refreshTokenKey(jti);
    const refreshTokenFamilyKey = this.refreshTokenFamilyKey(tokenFamilyId);
    const nextRefreshTokenKey = this.refreshTokenKey(nextJti);
    const activeStatus = REFRESH_TOKEN_ACTIVE_PREFIX + tokenFamilyId;

    const outcome = await this.redis.withOptimisticTransaction(
      [refreshTokenKey, refreshTokenFamilyKey, nextRefreshTokenKey],
      async (transaction) => {
        const [status, revoked] = await Promise.all([
          transaction.get(refreshTokenKey),
          transaction.get(refreshTokenFamilyKey),
        ]);

        if (revoked) {
          return { result: 'invalid' as const };
        }

        if (status !== activeStatus) {
          if (status?.startsWith('consumed:')) {
            return {
              result: 'reuse' as const,
              writes: [{
                key: refreshTokenFamilyKey,
                value: '1',
                ttlSeconds: REFRESH_TOKEN_TTL_SECONDS,
              }],
            };
          }

          return { result: 'invalid' as const };
        }

        return {
          result: 'rotated' as const,
          writes: [
            {
              key: refreshTokenKey,
              value: 'consumed:' + tokenFamilyId,
              ttlSeconds: previousTokenTtl,
            },
            {
              key: nextRefreshTokenKey,
              value: activeStatus,
              ttlSeconds: REFRESH_TOKEN_TTL_SECONDS,
            },
          ],
        };
      },
    );

    if (outcome === 'rotated') return;
    if (outcome === 'reuse') throw new AuthTokenStoreError('Refresh token reuse detected');
    throw new AuthTokenStoreError('Refresh token is not active');
  }

  async revokeRefresh(
    tokenFamilyId: string,
    ttlSeconds = REFRESH_TOKEN_TTL_SECONDS,
  ): Promise<void> {
    await this.redis.setOrThrow(
      this.refreshTokenFamilyKey(tokenFamilyId),
      '1',
      Math.max(1, ttlSeconds),
    );
  }

  async blacklist(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;
    await this.redis.setOrThrow(this.blacklistKey(jti), '1', ttlSeconds);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    return this.redis.exists(this.blacklistKey(jti));
  }

  async cutoff(userId: string): Promise<void> {
    await this.redis.setOrThrow(
      this.accessCutoffKey(userId),
      String(Math.floor(Date.now() / 1000)),
      ACCESS_TOKEN_TTL_SECONDS,
    );
  }

  async isCutoff(userId: string, issuedAt: number): Promise<boolean> {
    const cutoff = await this.redis.get<number | string>(this.accessCutoffKey(userId));
    const cutoffSeconds = typeof cutoff === 'number' ? cutoff : Number(cutoff);
    return Number.isFinite(cutoffSeconds) && issuedAt < cutoffSeconds;
  }

  private refreshTokenKey(jti: string): string {
    return 'auth:refresh:' + jti;
  }

  private refreshTokenFamilyKey(tokenFamilyId: string): string {
    return 'auth:refresh:family:' + tokenFamilyId;
  }

  private blacklistKey(jti: string): string {
    return 'auth:blacklist:' + jti;
  }

  private accessCutoffKey(userId: string): string {
    return 'auth:access:cutoff:' + userId;
  }
}
