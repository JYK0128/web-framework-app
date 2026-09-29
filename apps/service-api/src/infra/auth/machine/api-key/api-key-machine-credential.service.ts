import { Injectable } from '@nestjs/common';

import type { MachineCredentialService } from '#/infra/auth/machine/machine-auth.interface';

@Injectable()
export class ApiKeyMachineCredentialService implements MachineCredentialService {
  constructor(private readonly apiKey: string) {}

  async createCredential(): Promise<{ type: 'api-key', value: string }> {
    return { type: 'api-key', value: this.apiKey };
  }
}
