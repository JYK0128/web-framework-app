import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApplicationError, TimeUtil, uuid } from '@pkg/shared/common';

import { TokenStoreService } from '#/common/services/token-store.service';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

export interface CreateTokenPairOptions {
  rememberMe?: boolean
}

export interface TokenPairResult {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly jwtService: JwtService,
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

    const roleCode = user.role.code;
    const permissions = (user.role.permissions ?? []) as string[];
    const refreshToken = `rt_${uuid()}`;
    const tokenTtlSeconds = options?.rememberMe ? TimeUtil.s.day(30) : TimeUtil.s.day(1);

    await this.tokenStoreService.store(
      refreshToken,
      {
        sub: user.id,
        roles: [roleCode],
        permissions,
      },
      tokenTtlSeconds,
    );

    const accessToken = await this.issueAccessToken(user, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: TimeUtil.s.minute(3),
    };
  }

  async rotateTokenPair(
    oldRefreshToken: string,
    user: User,
    options?: CreateTokenPairOptions,
  ): Promise<TokenPairResult> {
    await this.tokenStoreService.revoke(oldRefreshToken);
    return this.createTokenPair(user, options);
  }

  async issueAccessToken(user: User, refreshToken: string): Promise<string> {
    if (!user.role) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        status: HttpStatus.FORBIDDEN,
        message: '사용자에게 할당된 역할이 없습니다.',
      });
    }

    const roleCode = user.role.code;
    const permissions = (user.role.permissions ?? []) as string[];

    return this.jwtService.signAsync(
      {
        jti: refreshToken,
        roles: [roleCode],
        permissions,
      },
      {
        secret: env.APP_SECRET,
        issuer: 'service-api',
        audience: 'service-api',
        subject: user.id,
        expiresIn: '180s',
        algorithm: 'HS256',
      },
    );
  }

  async issueM2MToken(actorId: string, requestId?: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        requestId: requestId ?? `req_${uuid()}`,
      },
      {
        secret: env.INTERNAL_JWT_SECRET,
        issuer: 'service-api',
        audience: 'admin-api',
        subject: actorId,
        expiresIn: '60s',
        algorithm: 'HS256',
      },
    );
  }
}
