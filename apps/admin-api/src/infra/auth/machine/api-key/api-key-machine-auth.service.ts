import { timingSafeEqual } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';

import { PrincipalContext } from '#/common/contexts/principal.context';
import type { MachineAuthVerifier } from '#/infra/auth/machine/machine-auth.interface';

@Injectable()
export class ApiKeyMachineAuthService implements MachineAuthVerifier {
  constructor(
    private readonly principalContext: PrincipalContext,
    private readonly apiKey: string,
  ) {}

  async verify(request: Request): Promise<void> {
    const providedKey = request.header('x-api-key');
    if (!providedKey || !this.matches(providedKey)) {
      throw new ApplicationError({ code: 'MACHINE_AUTHENTICATION_FAILED', status: HttpStatus.FORBIDDEN });
    }
    this.principalContext.set({ type: 'machine', id: 'api-key' });
  }

  private matches(providedKey: string): boolean {
    const expected = Buffer.from(this.apiKey);
    const actual = Buffer.from(providedKey);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
