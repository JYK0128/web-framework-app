export const OAUTH_PROVIDERS = ['google', 'kakao', 'naver', 'github'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export const LOCAL_AUTH_PROVIDER = 'credential' as const;
export type LocalAuthProvider = typeof LOCAL_AUTH_PROVIDER;

export const AUTH_PROVIDERS = [LOCAL_AUTH_PROVIDER, ...OAUTH_PROVIDERS] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 24;
export const PASSWORD_POLICY_REGEX = '^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$';
export const PASSWORD_HISTORY_LIMIT = 3;
export const PASSWORD_CHANGE_DEFER_DAYS = 30;
