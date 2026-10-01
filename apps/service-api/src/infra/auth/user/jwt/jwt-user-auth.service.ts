import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil, uuid } from '@pkg/shared/common';
import { SignJWT } from 'jose';

import { SECURITY_CONFIG, SERVICE_ID } from '#/app.config';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { type CreateTokenPairOptions, type IUserAuthService, type RefreshInput, type TokenPairResult } from '#/infra/auth/user/user-auth.interface';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { isCredentialPasswordExpired } from '#/modules/auth/password-policy';

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
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED, message: '인증 토큰이 존재하지 않습니다.' });
    }

    const consumed = await this.tokenStore.consumeToken(refreshToken);
    if (consumed.status === 'fail') {
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
        message: consumed.reason === 'reused' ? '이미 사용된 refresh token입니다. 인증 세션을 종료합니다.' : '토큰이 만료되었거나 로그아웃되었습니다.',
      });
    }

    const tokenData = consumed.record;
    const user = await this.em.findOne(User, { id: tokenData.sub }, { populate: ['role'] });
    if (!user || user.isBanned || user.isLocked) {
      await this.tokenStore.revokeTokenFamily(tokenData.familyId);
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED, message: '계정 상태가 유효하지 않아 인증이 종료되었습니다.' });
    }

    const account = await this.em.findOne(Account, { user: user.id, providerId: Account.PROVIDER_CREDENTIAL });
    if (account?.password && isCredentialPasswordExpired(account)) {
      await this.tokenStore.revokeTokenFamily(tokenData.familyId);
      throw new ApplicationError({ code: 'PASSWORD_EXPIRED', status: HttpStatus.FORBIDDEN, message: '비밀번호가 만료됐습니다. 비밀번호 재설정 후 다시 로그인해 주세요.' });
    }

    return this.issue(user, { rememberMe: tokenData.rememberMe === true, familyId: tokenData.familyId });
  }

  private async issue(user: User, options?: CreateTokenPairOptions): Promise<TokenPairResult> {
    if (!user.role) throw new ApplicationError({ code: 'FORBIDDEN', status: HttpStatus.FORBIDDEN, message: '사용자에게 할당된 역할이 없습니다.' });
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
    if (!user.role) throw new ApplicationError({ code: 'FORBIDDEN', status: HttpStatus.FORBIDDEN, message: '사용자에게 할당된 역할이 없습니다.' });
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
      .sign(new TextEncoder().encode(env.APP_JWT_SECRET));
  }

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) await this.tokenStore.revokeToken(refreshToken);
  }
}
