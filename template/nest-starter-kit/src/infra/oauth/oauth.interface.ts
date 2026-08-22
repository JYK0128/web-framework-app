export const OAUTH_MODULE_OPTIONS = Symbol('OAUTH_MODULE_OPTIONS');
export const OAUTH_CHANNELS = Symbol('OAUTH_CHANNELS');

export const OAUTH_PROVIDERS = ['google', 'kakao', 'naver', 'github'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export interface OAuthProviderCredentials {
  clientId: string
  clientSecret: string
}

export interface OAuthModuleOptions {
  callbackUrl: string
  google?: OAuthProviderCredentials
  kakao?: OAuthProviderCredentials
  naver?: OAuthProviderCredentials
  github?: OAuthProviderCredentials
  providers?: Partial<Record<OAuthProvider, OAuthProviderCredentials>>
}

export interface OAuthProfile {
  id: string
  email: string
  name?: string
  avatarUrl?: string
}

export interface OAuthToken {
  accessToken: string
  refreshToken?: string
}

export interface OAuthContext {
  callbackUrl: string
  credentials: OAuthProviderCredentials
}

export interface IOAuthChannel {
  readonly provider: OAuthProvider

  /** 프로바이더별 인가(Authorize) URL 생성 */
  createAuthorizeUrl(state: string, context: OAuthContext): string

  /** 인가 코드를 액세스/리프레시 토큰으로 교환 */
  exchangeCode(code: string, context: OAuthContext): Promise<OAuthToken | null>

  /** 액세스 토큰으로 프로필 조회 및 정규화 */
  fetchProfile(accessToken: string): Promise<OAuthProfile | null>

  /** 계정 연동 해제 및 외부 토큰 폐기 */
  revokeToken?(token: string): Promise<void>
}
