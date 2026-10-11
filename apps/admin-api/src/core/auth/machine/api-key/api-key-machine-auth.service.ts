import { timingSafeEqual } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';

import type { MachineAuthVerifier } from '#/core/auth/machine/machine-auth.interface';
import { PrincipalContext } from '#/core/http/contexts/principal.context';

@Injectable()
export class ApiKeyMachineAuthService implements MachineAuthVerifier {
  constructor(
    private readonly principalContext: PrincipalContext,
    private readonly apiKey: string,
    private readonly callerService: string,
  ) {}

  async verify(request: Request): Promise<void> {
    const providedKey = request.header('x-api-key');
    if (!providedKey || !this.matches(providedKey)) {
      throw new ApplicationError({ code: 'MACHINE_AUTHENTICATION_FAILED', status: HttpStatus.FORBIDDEN });
    }
    this.principalContext.set({ type: 'machine', id: this.callerService });
  }

  private matches(providedKey: string): boolean {
    const expected = Buffer.from(this.apiKey);
    const actual = Buffer.from(providedKey);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
