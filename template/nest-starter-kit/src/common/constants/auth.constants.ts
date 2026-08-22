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

export const LOGIN_FAILURE_LOCK_THRESHOLD = 5;
export const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;

export const TWO_FACTOR_CHALLENGE_TTL_MS = 10 * 60 * 1000;
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
