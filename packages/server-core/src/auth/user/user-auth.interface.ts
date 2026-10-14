import type { AuthPrincipal } from '@pkg/server-core/http/types/principal.type';
import type { Request } from 'express';

export interface AuthUser {
  id: string
  phoneNumberVerified: boolean
  twoFactorEnabled: boolean
  isDeleted: boolean
  isBanned: boolean
  isLocked: boolean
  role: { id: string, code: string, permissions: string[] } | null
}

export interface AuthAccount {
  createdAt: Date
  password: string | null
  metadata: { passwordUpdatedAt?: Date | null, passwordHistory?: string[] } | null
}

export interface AuthReader {
  findUserById(userId: string): Promise<AuthUser | null>
  findCredentialAccount(userId: string): Promise<AuthAccount | null>
}

export const AUTH_READER = Symbol('AUTH_READER');
export const USER_AUTH_SERVICE = Symbol('USER_AUTH_SERVICE');
export const USER_AUTH_OPTIONS = Symbol('USER_AUTH_OPTIONS');
export const USER_AUTH_POLICY_OPTIONS = Symbol('USER_AUTH_POLICY_OPTIONS');
export const USER_JWT_OPTIONS = Symbol('USER_JWT_OPTIONS');
export const USER_SESSION_OPTIONS = Symbol('USER_SESSION_OPTIONS');

export interface UserAuthPolicyOptions {
  requirePhoneNumberVerification: boolean
  passwordExpirationDays: number
  passwordChangeDeferDays: number
  twoFactorRequired: boolean
}

export interface UserJwtOptions {
  secret: string
  issuer: string
  audience: string
  accessTokenTtlMinutes: number
  refreshIdleTimeoutMinutes: number
  rememberMeDays: number
  revokeOnLogin: boolean
}

export interface UserSessionOptions {
  sessionSecret: string
  cookieName: string
  cookieSecure: boolean
  cookieSameSite: 'lax' | 'strict' | 'none'
  refreshIdleTimeoutMinutes: number
  rememberMeDays: number
}

export interface CreateTokenPairOptions { rememberMe?: boolean, familyId?: string }
export interface TokenPairResult { accessToken?: string, refreshToken?: string, refreshTokenTtlSeconds?: number }
export interface RefreshInput { refreshToken?: string }

export interface IUserAuthService {
  authenticate(request: Request): Promise<Extract<AuthPrincipal, { type: 'user' }>>
  login(user: AuthUser, options?: CreateTokenPairOptions): Promise<TokenPairResult>
  refresh(input: RefreshInput): Promise<TokenPairResult>
  logout(refreshToken?: string): Promise<void>
  revokeUserTokens?(userId: string): Promise<void>
  invalidateRoleTokens?(roleId: string): Promise<void>
}

export type UserAuthModuleOptions
  = | { driver: 'jwt', jwt: UserJwtOptions, policy: UserAuthPolicyOptions }
    | { driver: 'session', session: UserSessionOptions, policy: UserAuthPolicyOptions };
