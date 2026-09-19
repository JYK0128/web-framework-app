import { Injectable } from '@nestjs/common';
import { MACHINE_TOKEN_TTL_SECONDS, type MachineTokenClaims, uuid } from '@pkg/shared/common';
import { SignJWT } from 'jose';

import { SERVICE_ID } from '#/config';
import { env } from '#/env';

export interface CreateMachineTokenOptions {
  targetService: string
}

@Injectable()
export class MachineTokenService {
  async createMachineToken(options: CreateMachineTokenOptions): Promise<string> {
    const payload: Omit<MachineTokenClaims, 'iat' | 'exp'> = {
      iss: SERVICE_ID,
      aud: options.targetService,
      sub: SERVICE_ID,
      jti: uuid(),
    };

    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(SERVICE_ID)
      .setAudience(options.targetService)
      .setIssuedAt()
      .setExpirationTime(`${MACHINE_TOKEN_TTL_SECONDS}s`)
      .sign(new TextEncoder().encode(env.INTERNAL_JWT_SECRET));
  }
}
