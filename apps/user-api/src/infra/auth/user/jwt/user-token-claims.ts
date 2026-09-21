import { z } from '@pkg/shared/common';

const standardTokenClaims = {
  iss: z.string(), aud: z.string(), sub: z.string(), jti: z.string(), iat: z.number(), exp: z.number(),
};

export const UserTokenClaimsSchema = z.object({ ...standardTokenClaims, roles: z.array(z.string()), permissions: z.array(z.string()) });
export type UserTokenClaims = z.infer<typeof UserTokenClaimsSchema>;
