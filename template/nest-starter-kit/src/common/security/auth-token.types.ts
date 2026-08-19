import type { RoleName } from '#/entities/auth.extentions/role.entity';

export type AuthTokenType = 'access' | 'refresh';

export type AuthTokenPair = {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
};

export type AuthPrincipal = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  passwordChangedAt: number | null
  role: RoleName | null
};

export type AuthTokenClaims = {
  jti: string
  userId: string
  name: string
  email: string
  emailVerified: boolean
  passwordChangedAt: number | null
  role: RoleName | null
  tokenFamilyId: string
  issuedAt: number
  expiresAt: number
};

export type IssuedAuthToken = {
  token: string
  jti: string
};

export function toAuthPrincipal(claims: AuthTokenClaims): AuthPrincipal {
  return {
    id: claims.userId,
    name: claims.name,
    email: claims.email,
    emailVerified: claims.emailVerified,
    passwordChangedAt: claims.passwordChangedAt,
    role: claims.role,
  };
}
