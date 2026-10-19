import type { User } from '#/entities/auth/user.entity';

export const USER_AUTH_SERVICE = Symbol('USER_AUTH_SERVICE');
export const USER_AUTH_DRIVER = Symbol('USER_AUTH_DRIVER');

export interface CreateTokenPairOptions { rememberMe?: boolean, familyId?: string }
export interface TokenPairResult { accessToken?: string, refreshToken?: string, refreshTokenTtlSeconds?: number }
export interface RefreshInput { refreshToken?: string, cookieRefreshToken?: string }

export interface IUserAuthService {
  login(user: User, options?: CreateTokenPairOptions): Promise<TokenPairResult>
  refresh(input: RefreshInput): Promise<TokenPairResult>
  logout(refreshToken?: string): Promise<void>
}

export type UserAuthDriver = 'jwt' | 'session';
export type AuthStoreDriver = 'redis' | 'database';

export type UserAuthModuleOptions
  = | { driver: 'jwt', tokenStore?: AuthStoreDriver }
    | { driver: 'session', sessionStore?: AuthStoreDriver };
