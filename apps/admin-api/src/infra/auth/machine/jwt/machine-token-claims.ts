import { z } from '@pkg/shared/common';

const standardTokenClaims = {
  iss: z.string(), aud: z.string(), sub: z.string(), jti: z.string(), iat: z.number(), exp: z.number(),
};

export const MachineTokenClaimsSchema = z.object(standardTokenClaims);
export type MachineTokenClaims = z.infer<typeof MachineTokenClaimsSchema>;
