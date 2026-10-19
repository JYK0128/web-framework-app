export interface OAuthHttpRequestOptions {
  preventRedirects?: boolean
}

export type OAuthHttpRequest = (
  url: string | URL,
  init: RequestInit,
  options?: OAuthHttpRequestOptions,
) => Promise<Response>;

export interface OAuthProviderModuleOptions {
  namespace: string
  stateTtlMinutes: number
  requestTimeoutMs: number
  allowHttp: boolean
  encryptionKey: string
  preventJwksRedirects?: boolean
  httpRequest?: OAuthHttpRequest
}

export const OAUTH_PROVIDER_OPTIONS = Symbol('OAUTH_PROVIDER_OPTIONS');
