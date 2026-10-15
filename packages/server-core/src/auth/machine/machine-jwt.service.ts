import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApplicationError, TimeUtil, uuid } from '@pkg/shared/common';
import type { Request } from 'express';
import { jwtVerify, SignJWT } from 'jose';

import { MACHINE_AUTH_OPTIONS, type MachineAuthIssuer, type MachineAuthOptions, type MachineAuthVerifier } from '#auth/machine/machine-auth.interface';
import { PrincipalContext } from '#http/contexts/principal.context';

@Injectable()
export class MachineJwtService implements MachineAuthVerifier, MachineAuthIssuer {
  constructor(private readonly principalContext: PrincipalContext, @Inject(MACHINE_AUTH_OPTIONS) private readonly options: MachineAuthOptions) {}

  async verify(request: Request): Promise<void> {
    const token = (request.header('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
    if (!token) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    try {
      const result = await jwtVerify(token, new TextEncoder().encode(this.options.secret), { issuer: this.options.allowedIssuers, audience: this.options.serviceId, algorithms: ['HS256'] });
      const { iss, sub } = result.payload;
      if (typeof sub !== 'string' || sub !== iss) throw new ApplicationError({ code: 'MACHINE_AUTHENTICATION_FAILED', status: HttpStatus.FORBIDDEN });
      this.principalContext.set({ type: 'machine', id: sub });
    }
    catch (error: unknown) {
      if (error instanceof ApplicationError) throw error;
      throw ApplicationError.from(error, { code: 'MACHINE_AUTHENTICATION_FAILED', status: HttpStatus.FORBIDDEN });
    }
  }

  async issue(input: { targetService: string }): Promise<{ type: 'bearer', value: string }> {
    const serviceId = this.options.serviceId;
    const value = await new SignJWT({ iss: serviceId, aud: input.targetService, sub: serviceId, jti: uuid() })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(serviceId).setAudience(input.targetService).setIssuedAt()
      .setExpirationTime(`${TimeUtil.s.minute(this.options.tokenTtlMinutes)}s`)
      .sign(new TextEncoder().encode(this.options.secret));
    return { type: 'bearer', value };
  }
}
