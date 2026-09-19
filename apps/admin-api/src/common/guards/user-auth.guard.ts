import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, UserTokenClaimsSchema } from '@pkg/shared/common';
import type { Request } from 'express';
import { jwtVerify } from 'jose';
import { ClsService } from 'nestjs-cls';

import { env } from '#/env';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(private readonly cls: ClsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = (request.header('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    let payload: ReturnType<typeof UserTokenClaimsSchema.parse>;
    try {
      const result = await jwtVerify(token, new TextEncoder().encode(env.APP_SECRET), {
        issuer: 'admin-api',
        audience: 'admin-api',
        algorithms: ['HS256'],
      });
      payload = UserTokenClaimsSchema.parse(result.payload);
    }
    catch {
      throw new ApplicationError({
        code: 'AUTHENTICATION_REQUIRED',
        status: HttpStatus.UNAUTHORIZED,
      });
    }

    this.cls.set('principal', {
      type: 'user',
      id: payload.sub,
      roles: payload.roles,
      permissions: payload.permissions,
    });
    return true;
  }
}
