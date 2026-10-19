import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil, uuid } from '@pkg/shared/common';
import { SignJWT } from 'jose';

import { SECURITY_CONFIG, SERVICE_ID } from '#/app.config';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { type CreateTokenPairOptions, type IUserAuthService, type RefreshInput, type TokenPairResult } from '#/infra/auth/user/user-auth.interface';
import { AppEntityManager } from '#/infra/database/entity-manager';

import { TOKEN_STORE, type TokenStore } from './token.store';
import { getTokenSessionTtls } from './token-session-ttl';
import type { UserTokenClaims } from './user-token-claims';

@Injectable()
export class JwtUserAuthService implements IUserAuthService {
  constructor(
    private readonly em: AppEntityManager,
    @Inject(TOKEN_STORE) private readonly tokenStore: TokenStore,
  ) {}

  async login(user: User, options?: CreateTokenPairOptions): Promise<TokenPairResult> {
    if (SECURITY_CONFIG.token.revokeOnLogin && !options?.familyId) {
      await this.tokenStore.revokeUserTokens(user.id);
      await this.em.flush();
    }
    return this.issue(user, options);
  }

  async refresh(input: RefreshInput): Promise<TokenPairResult> {
    const refreshToken = input.refreshToken || input.cookieRefreshToken;
    if (!refreshToken) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const consumed = await this.tokenStore.consumeToken(refreshToken);
    if (consumed.status === 'fail') {
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    const tokenData = consumed.record;
    const user = await this.em.findOne(User, { id: tokenData.sub }, { populate: ['role'] });
    if (!user || user.isBanned || user.isLocked) {
      await this.tokenStore.revokeTokenFamily(tokenData.familyId);
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    return this.issue(user, { rememberMe: tokenData.rememberMe === true, familyId: tokenData.familyId });
  }

  private async issue(user: User, options?: CreateTokenPairOptions): Promise<TokenPairResult> {
    if (!user.role) throw new ApplicationError({ code: 'FORBIDDEN', status: HttpStatus.FORBIDDEN });
    const refreshToken = `rt_${uuid()}`;
    const rememberMe = options?.rememberMe === true;
    const familyId = options?.familyId ?? uuid();
    const { sessionTtlSeconds, refreshTokenRetentionSeconds } = getTokenSessionTtls(rememberMe);
    await this.tokenStore.storeToken(refreshToken, {
      sub: user.id,
      rememberMe,
      familyId,
      expiresAt: Date.now() + TimeUtil.ms.second(refreshTokenRetentionSeconds),
    }, refreshTokenRetentionSeconds, sessionTtlSeconds);
    return { accessToken: await this.issueAccessToken(user, familyId, rememberMe), refreshToken, refreshTokenTtlSeconds: refreshTokenRetentionSeconds };
  }

  private async issueAccessToken(user: User, familyId: string, rememberMe: boolean): Promise<string> {
    if (!user.role) throw new ApplicationError({ code: 'FORBIDDEN', status: HttpStatus.FORBIDDEN });
    const tokenClaims: Pick<UserTokenClaims, 'jti' | 'roles' | 'permissions' | 'sid' | 'rememberMe'> = {
      jti: uuid(),
      roles: [user.role.code],
      permissions: user.role.permissions ?? [],
      sid: familyId,
      rememberMe,
    };
    return new SignJWT(tokenClaims)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(SERVICE_ID).setAudience(SERVICE_ID).setSubject(user.id).setIssuedAt()
      .setExpirationTime(`${TimeUtil.s.minute(SECURITY_CONFIG.token.accessTokenTtlMinutes)}s`)
      .sign(new TextEncoder().encode(env.USER_JWT_SECRET));
  }

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) await this.tokenStore.revokeToken(refreshToken);
  }
}
