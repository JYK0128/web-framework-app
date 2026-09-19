import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil, type UserTokenClaims, uuid } from '@pkg/shared/common';
import { SignJWT } from 'jose';

import { TokenStoreService } from '#/common/services/token-store.service';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

export interface CreateTokenPairOptions {
  rememberMe?: boolean
  familyId?: string
}

export interface TokenPairResult {
  accessToken: string
  refreshToken: string
  refreshTokenTtlSeconds: number
}

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly tokenStoreService: TokenStoreService,
  ) {}

  async createTokenPair(user: User, options?: CreateTokenPairOptions): Promise<TokenPairResult> {
    if (!user.role) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        status: HttpStatus.FORBIDDEN,
        message: '사용자에게 할당된 역할이 없습니다.',
      });
    }

    const refreshToken = `rt_${uuid()}`;
    const tokenTtlSeconds = options?.rememberMe ? TimeUtil.s.day(30) : TimeUtil.s.minute(30);
    const familyId = options?.familyId ?? uuid();

    await this.tokenStoreService.storeRefreshToken(
      refreshToken,
      {
        sub: user.id,
        rememberMe: options?.rememberMe === true,
        familyId,
        expiresAt: Date.now() + TimeUtil.ms.second(tokenTtlSeconds),
      },
      tokenTtlSeconds,
    );

    const accessToken = await this.issueAccessToken(user);

    return {
      accessToken,
      refreshToken,
      refreshTokenTtlSeconds: tokenTtlSeconds,
    };
  }

  async rotateTokenPair(user: User, options?: CreateTokenPairOptions): Promise<TokenPairResult> {
    return this.createTokenPair(user, options);
  }

  async issueAccessToken(user: User): Promise<string> {
    if (!user.role) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        status: HttpStatus.FORBIDDEN,
        message: '사용자에게 할당된 역할이 없습니다.',
      });
    }

    const roleCode = user.role.code;
    const permissions = (user.role.permissions ?? []) as string[];

    const tokenClaims: Pick<UserTokenClaims, 'jti' | 'roles' | 'permissions'> = {
      jti: uuid(),
      roles: [roleCode],
      permissions,
    };

    return new SignJWT(tokenClaims)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer('admin-api')
      .setAudience('admin-api')
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(`${TimeUtil.s.minute(10)}s`)
      .sign(new TextEncoder().encode(env.APP_SECRET));
  }
}
