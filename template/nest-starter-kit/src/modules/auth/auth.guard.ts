import { EntityManager, wrap } from '@mikro-orm/core';
import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { Policy, PROTECTED_KEY, type ProtectionPolicy } from '#/common/decorators/protected.decorator';
import { IS_PUBLIC_KEY } from '#/common/decorators/public.decorator';
import { AccessTokenService } from '#/common/security/access-token.service';
import { User } from '#/entities/auth/user.entity';

function isKnownPolicy(policy: unknown): policy is ProtectionPolicy {
  return Object.values(Policy).includes(policy as ProtectionPolicy);
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
    @Inject(EntityManager) private readonly em: EntityManager,
    private readonly accessTokenService: AccessTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policies = this.reflector.getAllAndOverride<ProtectionPolicy[]>(PROTECTED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic && policies.length === 0) return true;

    if (!policies.every(isKnownPolicy)) return false;

    await this.authenticate(context);

    if (policies.includes(Policy.TWO_FACTOR)) {
      this.assertTwoFactor(context);
    }

    return true;
  }

  private async authenticate(context: ExecutionContext): Promise<void> {
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
    }
    catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.UNAUTHORIZED });
    }
  }

  private assertTwoFactor(_context: ExecutionContext): void {
    if (this.cls.get('authLevel') !== 'mfa') {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.FORBIDDEN });
    }
  }
}
