import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil, uuid } from '@pkg/shared/common';
import type { Request } from 'express';
import { jwtVerify, SignJWT } from 'jose';

import { MACHINE_ALLOWED_LIST, SECURITY_CONFIG, SERVICE_ID } from '#/app.config';
import type { MachineAuthIssuer, MachineAuthVerifier } from '#/core/auth/machine/machine-auth.interface';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { env } from '#/env';

@Injectable()
export class MachineJwtService implements MachineAuthVerifier, MachineAuthIssuer {
  constructor(private readonly principalContext: PrincipalContext) {}

  async verify(request: Request): Promise<void> {
    const token = (request.header('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    try {
      const result = await jwtVerify(token, new TextEncoder().encode(env.MACHINE_JWT_SECRET), {
        issuer: MACHINE_ALLOWED_LIST, audience: SERVICE_ID, algorithms: ['HS256'],
      });
      const { iss, sub } = result.payload;
      if (typeof sub !== 'string' || sub !== iss) throw new ApplicationError({ code: 'MACHINE_AUTHENTICATION_FAILED', status: HttpStatus.FORBIDDEN });
      this.principalContext.set({ type: 'machine', id: sub });
    }
    catch (error: unknown) {
      if (error instanceof ApplicationError) throw error;
      throw ApplicationError.from(error, { code: 'MACHINE_AUTHENTICATION_FAILED', status: HttpStatus.FORBIDDEN });
    }
  }

  async issue(options: { targetService: string }): Promise<{ type: 'bearer', value: string }> {
    const payload = { iss: SERVICE_ID, aud: options.targetService, sub: SERVICE_ID, jti: uuid() };
    const value = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(SERVICE_ID)
      .setAudience(options.targetService)
      .setIssuedAt()
      .setExpirationTime(`${TimeUtil.s.minute(SECURITY_CONFIG.token.machineTokenTtlMinutes)}s`)
      .sign(new TextEncoder().encode(env.MACHINE_JWT_SECRET));
    return { type: 'bearer', value };
  }
}
