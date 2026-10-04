import { z } from 'zod';

export const MACHINE_TOKEN_TTL_MINUTES = 1;

export const MachineTokenClaimsSchema = z.object({
  iss: z.string().min(1),
  aud: z.string().min(1),
  sub: z.string().min(1),
  jti: z.string().min(1),
  iat: z.number().int(),
  exp: z.number().int(),
});
export type MachineTokenClaims = z.infer<typeof MachineTokenClaimsSchema>;

export const MachineConnectionSchema = z.object({
  targetService: z.string().min(1),
  baseUrl: z.url({ protocol: /^https?$/ }),
});
export type MachineConnection = z.infer<typeof MachineConnectionSchema>;
