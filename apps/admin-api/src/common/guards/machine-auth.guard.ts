import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, MachineTokenClaimsSchema } from '@pkg/shared/common';
import type { Request } from 'express';
import { jwtVerify } from 'jose';
import { ClsService } from 'nestjs-cls';

import { MACHINE_ALLOWED_LIST, SERVICE_ID } from '#/config';
import { env } from '#/env';

@Injectable()
export class MachineAuthGuard implements CanActivate {
  constructor(private readonly cls: ClsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = (request.header('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    try {
      const result = await jwtVerify(token, new TextEncoder().encode(env.INTERNAL_JWT_SECRET), {
        issuer: MACHINE_ALLOWED_LIST,
        audience: SERVICE_ID,
        algorithms: ['HS256'],
      });
      const claims = MachineTokenClaimsSchema.parse(result.payload);

      if (claims.sub !== claims.iss) {
        throw new ApplicationError({ code: 'MACHINE_AUTHENTICATION_FAILED', status: HttpStatus.FORBIDDEN });
      }

      this.cls.set('principal', { type: 'machine', id: claims.sub });
      return true;
    }
    catch (error: unknown) {
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError({ code: 'MACHINE_AUTHENTICATION_FAILED', status: HttpStatus.FORBIDDEN });
    }
  }
}
