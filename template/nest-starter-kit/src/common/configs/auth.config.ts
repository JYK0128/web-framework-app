import { defineEnum } from '#/common/dto/enum';

export const OAuthProvider = defineEnum('OAuthProvider', {
  GOOGLE: 'google',
  KAKAO: 'kakao',
  NAVER: 'naver',
  GITHUB: 'github',
} as const);
export type OAuthProvider = (typeof OAuthProvider)[keyof typeof OAuthProvider];
export const OAUTH_PROVIDERS: OAuthProvider[] = Object.values(OAuthProvider);

export const AuthProvider = defineEnum('AuthProvider', {
  CREDENTIAL: 'credential',
  ...OAuthProvider,
} as const);
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];
export const AUTH_PROVIDERS: AuthProvider[] = Object.values(AuthProvider);

export const LOCAL_AUTH_PROVIDER = AuthProvider.CREDENTIAL;
export type LocalAuthProvider = typeof LOCAL_AUTH_PROVIDER;

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 24;
export const PASSWORD_POLICY_REGEX = '^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$';
export const PASSWORD_HISTORY_LIMIT = 3;
export const PASSWORD_CHANGE_DEFER_DAYS = 30;

export const LOGIN_FAILURE_LOCK_THRESHOLD = 5;
export const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;

export const TWO_FACTOR_CHALLENGE_TTL_MS = 10 * 60 * 1000;
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
