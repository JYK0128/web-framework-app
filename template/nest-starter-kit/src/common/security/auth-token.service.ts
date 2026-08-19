import { Injectable } from '@nestjs/common';
import { randomBase64Url } from '@pkg/shared/server';

import { AuthTokenCodec } from './auth-token.codec';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from './auth-token.constants';
import { AuthTokenStore } from './auth-token.store';
import { type AuthPrincipal, type AuthTokenClaims, type AuthTokenPair } from './auth-token.types';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly codec: AuthTokenCodec,
    private readonly tokenStore: AuthTokenStore,
  ) {}

  // Token issuance
  async issue(principal: AuthPrincipal): Promise<AuthTokenPair> {
    const tokenFamilyId = randomBase64Url(32);
    const { pair, refreshJti } = await this.createPair(principal, tokenFamilyId);

    await this.tokenStore.registerRefresh(refreshJti, tokenFamilyId);
    return pair;
  }

  async rotate(
    principal: AuthPrincipal,
    claims: AuthTokenClaims,
  ): Promise<AuthTokenPair> {
    if (principal.passwordChangedAt !== claims.passwordChangedAt) {
      throw new Error('Refresh token is stale');
    }

    const tokenFamilyId = claims.tokenFamilyId;
    const { pair, refreshJti } = await this.createPair(principal, tokenFamilyId);

    await this.tokenStore.rotateRefresh(
      claims.jti,
      tokenFamilyId,
      refreshJti,
      this.getRefreshTtl(claims.expiresAt),
    );

    return pair;
  }

  // Token verification
  async verifyAccess(token: string): Promise<AuthTokenClaims> {
    return this.codec.verify(token, 'access');
  }

  async verifyRefresh(token: string): Promise<AuthTokenClaims> {
    return this.codec.verify(token, 'refresh');
  }

  // Token revocation
  async revokeRefresh(
    tokenFamilyId: string,
    ttlSeconds = REFRESH_TOKEN_TTL_SECONDS,
  ): Promise<void> {
    await this.tokenStore.revokeRefresh(tokenFamilyId, ttlSeconds);
  }

  async cutoff(userId: string): Promise<void> {
    await this.tokenStore.cutoff(userId);
  }

  async isCutoff(userId: string, issuedAt: number): Promise<boolean> {
    return this.tokenStore.isCutoff(userId, issuedAt);
  }

  async blacklist(jti: string, ttlSeconds: number): Promise<void> {
    await this.tokenStore.blacklist(jti, ttlSeconds);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    return this.tokenStore.isBlacklisted(jti);
  }

  // Token pair creation
  private async createPair(
    principal: AuthPrincipal,
    tokenFamilyId: string,
  ): Promise<{ pair: AuthTokenPair, refreshJti: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.codec.issue(
        'access',
        principal,
        ACCESS_TOKEN_TTL_SECONDS,
        tokenFamilyId,
      ),
      this.codec.issue(
        'refresh',
        principal,
        REFRESH_TOKEN_TTL_SECONDS,
        tokenFamilyId,
      ),
    ]);

    return {
      pair: {
        accessToken: accessToken.token,
        refreshToken: refreshToken.token,
        tokenType: 'Bearer',
      },
      refreshJti: refreshToken.jti,
    };
  }

  private getRefreshTtl(expiresAt: number): number {
    return Math.max(1, expiresAt - Math.floor(Date.now() / 1000));
  }
}
