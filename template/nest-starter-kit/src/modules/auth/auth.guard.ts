import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { IS_PUBLIC_KEY } from '#/common/decorators/public.decorator';
import { AuthTokenService } from '#/common/security/auth-token.service';
import { toAuthPrincipal } from '#/common/security/auth-token.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
    private readonly authTokenService: AuthTokenService,
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
      const claims = await this.authTokenService.verifyAccess(token);

      if (await this.authTokenService.isBlacklisted(claims.jti)
        || await this.authTokenService.isCutoff(claims.userId, claims.issuedAt)) {
        throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.UNAUTHORIZED });
      }

      this.cls.set('user', toAuthPrincipal(claims));
      this.cls.set('tokenFamilyId', claims.tokenFamilyId);
      return true;
    }
    catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.UNAUTHORIZED });
    }
  }
}
