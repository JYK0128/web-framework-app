import type { Request } from 'express';
import { z } from 'zod';

export const MachineConnectionSchema = z.object({
  targetService: z.string().min(1),
  baseUrl: z.url({ protocol: /^https?$/ }),
});
export type MachineConnection = z.infer<typeof MachineConnectionSchema>;

export const MACHINE_CONNECTION = Symbol('MACHINE_CONNECTION');

export const MACHINE_AUTH_VERIFIER = Symbol('MACHINE_AUTH_VERIFIER');
export const MACHINE_AUTH_ISSUER = Symbol('MACHINE_AUTH_ISSUER');

export type MachineAuthDriver = 'jwt' | 'api-key';

export interface MachineAuthVerifier {
  verify(request: Request): Promise<void>
}

export interface MachineAuthIssuer {
  issue(options: { targetService: string }): Promise<{ type: 'bearer' | 'api-key', value: string }>
}

export type MachineAuthModuleOptions
  = | { driver: 'jwt', connection: MachineConnection }
    | { driver: 'api-key', connection: MachineConnection };
