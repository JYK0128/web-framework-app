import { timingSafeEqual } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';
import type { Request } from 'express';

import type { MachineAuthVerifier } from '#/core/auth/machine/machine-auth.interface';
import { PrincipalContext } from '#/core/http/contexts/principal.context';

interface ServiceApiKey {
  serviceId: string
  key: string
}

// Add keys provided to each service here.
const SERVICE_API_KEYS: readonly ServiceApiKey[] = [];

@Injectable()
export class ApiKeyService implements MachineAuthVerifier {
  constructor(private readonly principalContext: PrincipalContext) {
    const keys = new Set<string>();
    // eslint-disable-next-line sonarjs/no-empty-collection -- Keys are registered manually in SERVICE_API_KEYS; none are configured yet.
    for (const entry of SERVICE_API_KEYS) {
      if (!entry.serviceId.trim() || !entry.key.trim()) {
        throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
      }
      if (keys.has(entry.key)) throw new ApplicationError({ code: 'INTERNAL_SERVER_ERROR', status: HttpStatus.INTERNAL_SERVER_ERROR });
      keys.add(entry.key);
    }
  }

  async verify(request: Request): Promise<void> {
    const providedKey = request.header('x-api-key');
    // eslint-disable-next-line sonarjs/no-empty-collection -- An empty key registry intentionally rejects all API key requests.
    const service = providedKey ? SERVICE_API_KEYS.find((entry) => this.matches(providedKey, entry.key)) : undefined;
    if (!service) {
      throw new ApplicationError({ code: 'MACHINE_AUTHENTICATION_FAILED', status: HttpStatus.FORBIDDEN });
    }
    this.principalContext.set({ type: 'machine', id: service.serviceId });
  }

  private matches(providedKey: string, key: string): boolean {
    const expected = Buffer.from(key);
    const actual = Buffer.from(providedKey);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
