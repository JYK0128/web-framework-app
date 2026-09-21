import { CanActivate, ExecutionContext, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';
import { jwtVerify } from 'jose';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { RequestContext } from '#/common/contexts/request.context';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';

import { UserTokenClaimsSchema } from './jwt/user-token-claims';
import { USER_AUTH_DRIVER, type UserAuthDriver } from './user-auth.interface';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly principalContext: PrincipalContext,
    private readonly requestContext: RequestContext,
    private readonly em: AppEntityManager,
    @Inject(USER_AUTH_DRIVER) private readonly driver: UserAuthDriver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (this.driver === 'session') {
      const principal = this.requestContext.session?.principal;
      if (!principal) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
      const user = await this.em.findOne(User, { id: principal.id }, { populate: ['role'] });
      if (!user || user.isDeleted || user.isBanned || user.isLocked || !user.role) {
        throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
      }
      this.principalContext.setUser({ id: user.id, roles: [user.role.code], permissions: user.role.permissions ?? [] });
      return true;
    }

    const token = (request.header('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });

    let payload: ReturnType<typeof UserTokenClaimsSchema.parse>;
    try {
      const result = await jwtVerify(token, new TextEncoder().encode(env.APP_SECRET), {
        issuer: 'admin-api', audience: 'admin-api', algorithms: ['HS256'],
      });
      payload = UserTokenClaimsSchema.parse(result.payload);
    }
    catch {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    const user = await this.em.findOne(User, { id: payload.sub }, { populate: ['role'] });
    if (!user || user.isDeleted || user.isBanned || user.isLocked || !user.role) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    this.principalContext.setUser({ id: user.id, roles: [user.role.code], permissions: user.role.permissions ?? [] });
    return true;
  }
}
