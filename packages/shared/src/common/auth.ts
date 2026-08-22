export const OAUTH_PROVIDERS = ['google', 'kakao', 'naver', 'github'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export const LOCAL_AUTH_PROVIDER = 'credential' as const;
export type LocalAuthProvider = typeof LOCAL_AUTH_PROVIDER;

export const AUTH_PROVIDERS = [LOCAL_AUTH_PROVIDER, ...OAUTH_PROVIDERS] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];
