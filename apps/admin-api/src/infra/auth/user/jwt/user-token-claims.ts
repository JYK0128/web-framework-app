import { z } from '@pkg/shared/common';

const standardTokenClaims = {
  iss: z.string(), aud: z.string(), sub: z.string(), jti: z.string(), iat: z.number(), exp: z.number(),
};

export const UserTokenClaimsSchema = z.object({ ...standardTokenClaims, sid: z.string().optional(), rememberMe: z.boolean().optional() });
export type UserTokenClaims = z.infer<typeof UserTokenClaimsSchema>;
