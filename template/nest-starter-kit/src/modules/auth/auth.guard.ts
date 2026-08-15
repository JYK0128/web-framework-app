import { EntityManager, wrap } from '@mikro-orm/core';
import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { IS_PUBLIC_KEY } from '#/common/decorators/public.decorator';
import { AccessTokenService } from '#/common/security/access-token.service';
import { User } from '#/entities/auth/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
    @Inject(EntityManager) private readonly em: EntityManager,
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
      const user = await this.em.findOne(User, { id: claims.userId }, { filters: false });
      if (!user) throw new Error('User not found');
      if (user.isBanned || user.isDeleted) {
        throw new ApplicationError({ code: 'USER_BANNED', status: HttpStatus.FORBIDDEN });
      }

      this.cls.set('user', wrap(user).toPOJO());
      this.cls.set('authLevel', claims.authLevel);
      this.cls.set('impersonatedBy', claims.impersonatedBy);
      return true;
    }
    catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.UNAUTHORIZED });
    }
  }
}
