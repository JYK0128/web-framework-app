import type { Request } from 'express';

export const MACHINE_AUTH_VERIFIER = Symbol('MACHINE_AUTH_VERIFIER');
export const MACHINE_CREDENTIAL_SERVICE = Symbol('MACHINE_CREDENTIAL_SERVICE');

export type MachineAuthDriver = 'jwt' | 'api-key';

export interface MachineAuthVerifier {
  verify(request: Request): Promise<void>
}

export interface MachineCredentialService {
  createCredential(options: { targetService: string }): Promise<{ type: 'bearer' | 'api-key', value: string }>
}

export type MachineAuthModuleOptions
  = | { driver: 'jwt' }
    | { driver: 'api-key', apiKey: string };
