import { timingSafeEqual } from 'node:crypto';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';

import { MACHINE_AUTH_OPTIONS, type MachineAuthOptions, type MachineAuthVerifier } from '#auth/machine/machine-auth.interface';
import { PrincipalContext } from '#http/contexts/principal.context';

@Injectable()
export class ApiKeyService implements MachineAuthVerifier {
  constructor(private readonly principalContext: PrincipalContext, @Inject(MACHINE_AUTH_OPTIONS) private readonly options: MachineAuthOptions) {
    const keys = new Set<string>();
    for (const entry of options.apiKeys) {
      if (!entry.serviceId.trim() || !entry.key.trim() || keys.has(entry.key)) throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
      keys.add(entry.key);
    }
  }

  async verify(request: Request): Promise<void> {
    const providedKey = request.header('x-api-key');
    const service = providedKey ? this.options.apiKeys.find((entry) => this.matches(providedKey, entry.key)) : undefined;
    if (!service) throw new ApplicationError({ code: 'MACHINE_AUTHENTICATION_FAILED', status: HttpStatus.FORBIDDEN });
    this.principalContext.set({ type: 'machine', id: service.serviceId });
  }

  private matches(provided: string, expectedValue: string): boolean {
    const expected = Buffer.from(expectedValue);
    const actual = Buffer.from(provided);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
