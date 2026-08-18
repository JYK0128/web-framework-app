/** Fixed authentication policies shared by validation, handlers, and DTOs. */
export const CREDENTIAL_PROVIDER = 'credential';

export const LOGIN_FAILURE_LOCK_THRESHOLD = 5;
export const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 24;
export const PASSWORD_EXPIRATION_DAYS = 90;
export const PASSWORD_POLICY_REGEX = '^(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$';
export const PASSWORD_HISTORY_LIMIT = 3;
export const PASSWORD_CHANGE_DEFER_DAYS = 30;

export const TWO_FACTOR_CHALLENGE_TTL_MS = 10 * 60 * 1000;
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
