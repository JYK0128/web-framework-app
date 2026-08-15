import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { IS_PUBLIC_KEY } from '#/common/decorators/public.decorator';
import { AccessTokenService } from '#/common/security/access-token.service';
import { AuthCacheService } from '#/common/security/auth-cache.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
    private readonly authCacheService: AuthCacheService,
    private readonly accessTokenService: AccessTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    return this.authenticate(context);
  }

  private async authenticate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ header: (name: string) => string | undefined }>();
    const authorization = request.header('authorization');
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : null;

    if (!token) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    try {
      const claims = await this.accessTokenService.verifyAccessToken(token);

      // 1. 블랙리스트 토큰 확인 (로그아웃 등)
      if (await this.authCacheService.isTokenBlacklisted(claims.jti)) {
        throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.UNAUTHORIZED });
      }

      // 2. Redis 캐시 기반 유저 보안 상태 확인 (RDB 디스크 I/O 없음)
      const userState = await this.authCacheService.getUserState(claims.userId);
      if (!userState) {
        throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
      }

      if (userState.isBanned || userState.isDeleted) {
        throw new ApplicationError({ code: 'USER_BANNED', status: HttpStatus.FORBIDDEN });
      }

      // 3. 비밀번호 변경 후 이전 토큰 무효화 체크
      if (userState.passwordUpdatedAt && claims.issuedAt) {
        const passwordChangedAtSeconds = Math.floor(new Date(userState.passwordUpdatedAt).getTime() / 1000);
        if (claims.issuedAt < passwordChangedAtSeconds) {
          throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
        }
      }

      this.cls.set('user', userState);
      this.cls.set('authLevel', claims.authLevel);
      this.cls.set('impersonatedBy', claims.impersonatedBy);
      this.cls.set('tokenJti', claims.jti);
      this.cls.set('tokenExp', claims.expiresAt ?? null);
      return true;
    }
    catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.UNAUTHORIZED });
    }
  }
}
