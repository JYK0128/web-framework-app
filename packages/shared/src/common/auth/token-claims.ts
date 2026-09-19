import { TimeUtil } from '../time';
import { z } from '../zod';

const standardTokenClaims = {
  iss: z.string(),
  aud: z.string(),
  sub: z.string(),
  jti: z.string(),
  iat: z.number(),
  exp: z.number(),
};

export const UserTokenClaimsSchema = z.object({
  ...standardTokenClaims,
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});

export const MachineTokenClaimsSchema = z.object(standardTokenClaims);

export type UserTokenClaims = z.infer<typeof UserTokenClaimsSchema>;
export type MachineTokenClaims = z.infer<typeof MachineTokenClaimsSchema>;

export interface UserPrincipal {
  type: 'user'
  id: string
  roles: string[]
  permissions: string[]
}

export interface MachinePrincipal {
  type: 'machine'
  id: string
}

export type AuthenticatedPrincipal = UserPrincipal | MachinePrincipal;

export const MACHINE_TOKEN_TTL_SECONDS = TimeUtil.s.minute(1);
