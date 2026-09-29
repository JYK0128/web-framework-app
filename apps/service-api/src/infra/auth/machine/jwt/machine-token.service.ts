import { Injectable } from '@nestjs/common';
import { TimeUtil, uuid } from '@pkg/shared/common';
import { SignJWT } from 'jose';

import { SECURITY_CONFIG, SERVICE_ID } from '#/config';
import { env } from '#/env';

import type { MachineTokenClaims } from './machine-token-claims';

export interface CreateMachineCredentialOptions { targetService: string }

@Injectable()
export class MachineTokenService {
  async createCredential(options: CreateMachineCredentialOptions): Promise<{ type: 'bearer', value: string }> {
    const payload: Omit<MachineTokenClaims, 'iat' | 'exp'> = { iss: SERVICE_ID, aud: options.targetService, sub: SERVICE_ID, jti: uuid() };
    const value = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(SERVICE_ID)
      .setAudience(options.targetService)
      .setIssuedAt()
      .setExpirationTime(`${TimeUtil.s.minute(SECURITY_CONFIG.token.machineTokenTtlMinutes)}s`)
      .sign(new TextEncoder().encode(env.INTERNAL_JWT_SECRET));
    return { type: 'bearer', value };
  }
}
