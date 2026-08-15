import { Injectable } from '@nestjs/common';
import { randomBase64Url } from '@pkg/shared/server';
import { jwtVerify, SignJWT } from 'jose';

import { defineEnum } from '#/common/dto/enum';
import { env } from '#/env';

export const ACCESS_TOKEN_TTL_SECONDS = 5 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export const AuthLevel = defineEnum('AuthLevel', {
  PASSWORD: 'password',
  MFA: 'mfa',
} as const);

export type AuthLevel = (typeof AuthLevel)[keyof typeof AuthLevel];

export type VerifiedAccessToken = {
  jti: string
  userId: string
  authLevel: AuthLevel
  impersonatedBy: string | null
  issuedAt?: number
  expiresAt?: number
};

type TokenType = 'access' | 'refresh';

type VerifiedToken = VerifiedAccessToken & {
  tokenType: TokenType
};

@Injectable()
export class AccessTokenService {
  private readonly secret = new TextEncoder().encode(env.APP_SECRET);

  async issueTokenPair(
    userId: string,
    options: { authLevel?: AuthLevel, impersonatedBy?: string | null } = {},
  ): Promise<{
    accessToken: string
    refreshToken: string
    tokenType: 'Bearer'
  }> {
    const authLevel = options.authLevel ?? 'password';
    const impersonatedBy = options.impersonatedBy ?? null;

    const [accessToken, refreshToken] = await Promise.all([
      this.issueToken('access', userId, ACCESS_TOKEN_TTL_SECONDS, authLevel, impersonatedBy),
      this.issueToken('refresh', userId, REFRESH_TOKEN_TTL_SECONDS, authLevel, impersonatedBy),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  async verifyAccessToken(token: string): Promise<VerifiedAccessToken> {
    const verified = await this.verifyToken(token, 'access');
    return {
      jti: verified.jti,
      userId: verified.userId,
      authLevel: verified.authLevel,
      impersonatedBy: verified.impersonatedBy,
      issuedAt: verified.issuedAt,
      expiresAt: verified.expiresAt,
    };
  }

  async verifyRefreshToken(token: string): Promise<VerifiedAccessToken> {
    const verified = await this.verifyToken(token, 'refresh');
    return {
      jti: verified.jti,
      userId: verified.userId,
      authLevel: verified.authLevel,
      impersonatedBy: verified.impersonatedBy,
      issuedAt: verified.issuedAt,
      expiresAt: verified.expiresAt,
    };
  }

  private async issueToken(
    tokenType: TokenType,
    userId: string,
    ttlSeconds: number,
    authLevel: AuthLevel,
    impersonatedBy: string | null,
  ): Promise<string> {
    return new SignJWT({
      tokenType,
      authLevel,
      impersonatedBy,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(env.APP_NAME)
      .setAudience('react-starter-kit')
      .setSubject(userId)
      .setJti(randomBase64Url())
      .setIssuedAt()
      .setExpirationTime(`${ttlSeconds}s`)
      .sign(this.secret);
  }

  private async verifyToken(token: string, tokenType: TokenType): Promise<VerifiedToken> {
    const { payload } = await jwtVerify(token, this.secret, {
      algorithms: ['HS256'],
      issuer: env.APP_NAME,
      audience: 'react-starter-kit',
    });

    if (payload.tokenType !== tokenType || typeof payload.sub !== 'string' || typeof payload.jti !== 'string') {
      throw new Error('Invalid token');
    }

    return {
      jti: payload.jti,
      tokenType,
      userId: payload.sub,
      authLevel: payload.authLevel === 'mfa' ? 'mfa' : 'password',
      impersonatedBy: typeof payload.impersonatedBy === 'string' ? payload.impersonatedBy : null,
      issuedAt: payload.iat,
      expiresAt: payload.exp,
    };
  }
}
