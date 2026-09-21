import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil, uuid } from '@pkg/shared/common';
import { SignJWT } from 'jose';

import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { type CreateTokenPairOptions, type IUserAuthService, type RefreshInput, type TokenPairResult } from '#/infra/auth/user/user-auth.interface';
import { AppEntityManager } from '#/infra/database/entity-manager';

import { TOKEN_STORE, type TokenStore } from './token.store';
import type { UserTokenClaims } from './user-token-claims';

@Injectable()
export class JwtUserAuthService implements IUserAuthService {
  constructor(
    private readonly em: AppEntityManager,
    @Inject(TOKEN_STORE) private readonly tokenStore: TokenStore,
  ) {}

  async login(user: User, options?: CreateTokenPairOptions): Promise<TokenPairResult> {
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

    return this.issue(user, { rememberMe: tokenData.rememberMe === true, familyId: tokenData.familyId });
  }

  private async issue(user: User, options?: CreateTokenPairOptions): Promise<TokenPairResult> {
    if (!user.role) throw new ApplicationError({ code: 'FORBIDDEN', status: HttpStatus.FORBIDDEN, message: '사용자에게 할당된 역할이 없습니다.' });
    const refreshToken = `rt_${uuid()}`;
    const refreshTokenTtlSeconds = options?.rememberMe ? TimeUtil.s.day(30) : TimeUtil.s.minute(30);
    await this.tokenStore.storeToken(refreshToken, {
      sub: user.id,
      rememberMe: options?.rememberMe === true,
      familyId: options?.familyId ?? uuid(),
      expiresAt: Date.now() + TimeUtil.ms.second(refreshTokenTtlSeconds),
    }, refreshTokenTtlSeconds);
    return { accessToken: await this.issueAccessToken(user), refreshToken, refreshTokenTtlSeconds };
  }

  private async issueAccessToken(user: User): Promise<string> {
    if (!user.role) throw new ApplicationError({ code: 'FORBIDDEN', status: HttpStatus.FORBIDDEN, message: '사용자에게 할당된 역할이 없습니다.' });
    const tokenClaims: Pick<UserTokenClaims, 'jti'> = { jti: uuid() };
    return new SignJWT(tokenClaims)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer('admin-api').setAudience('admin-api').setSubject(user.id).setIssuedAt()
      .setExpirationTime(`${TimeUtil.s.minute(10)}s`)
      .sign(new TextEncoder().encode(env.APP_SECRET));
  }

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) await this.tokenStore.revokeToken(refreshToken);
  }
}
