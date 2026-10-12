import type { Request } from 'express';

import type { User } from '#/core/database/entities/auth';
import type { UserPrincipal } from '#/core/http/types/principal.type';

export interface CreateTokenPairOptions { rememberMe?: boolean, familyId?: string }
export interface TokenPairResult { accessToken?: string, refreshToken?: string, refreshTokenTtlSeconds?: number }
export interface RefreshInput { refreshToken?: string, cookieRefreshToken?: string }
export interface AuthenticatedUser {
  user: Pick<User, 'id' | 'phoneNumberVerified'> & { twoFactorSetupRequired: boolean }
  passwordExpiresAt?: number | null
  principal: Omit<UserPrincipal, 'type'>
}

export interface IUserAuthService {
  authenticate(request: Request): Promise<AuthenticatedUser>
  login(user: User, options?: CreateTokenPairOptions): Promise<TokenPairResult>
  refresh(input: RefreshInput): Promise<TokenPairResult>
  logout(refreshToken?: string): Promise<void>
  revokeUserTokens?(userId: string): Promise<void>
  revokeRoleUsersTokens?(roleId: string): Promise<void>
}

export const USER_AUTH_SERVICE = Symbol('USER_AUTH_SERVICE');

export type AuthStoreDriver = 'redis' | 'database';

export type UserAuthModuleOptions
  = | { driver: 'jwt', refreshTokenStore?: AuthStoreDriver }
    | { driver: 'session', sessionStore?: AuthStoreDriver };
