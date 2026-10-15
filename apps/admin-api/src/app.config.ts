import { ADMIN_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';

export const SERVICE_ID = 'admin-api';
export const MACHINE_ALLOWED_LIST = ['service-api'];
export const SECURITY_CONFIG = {
  request: { bodyMaxSizeBytes: 10 * 1024 * 1024, trustProxy: true },
  credentialAvailable: ADMIN_AUTH_POLICY_CONFIG.credentialAvailable,
  oauthAvailable: ADMIN_AUTH_POLICY_CONFIG.oauthAvailable,
  cookie: { secure: process.env.NODE_ENV === 'production', sameSite: 'lax' },
  registration: { oauthDefaultRoleCode: '', allowRegistration: ADMIN_AUTH_POLICY_CONFIG.registrationAvailable, requireEmailVerification: ADMIN_AUTH_POLICY_CONFIG.emailVerificationRequired, requirePhoneNumberVerification: ADMIN_AUTH_POLICY_CONFIG.phoneNumberVerificationRequired, emailVerificationTokenTtlMinutes: 15 },
  session: { cookieName: 'session' },
  token: { revokeOnLogin: false, refreshCookieName: 'admin_refresh_token', refreshIdleTimeoutMinutes: 30, accessTokenTtlMinutes: 10, machineTokenTtlMinutes: 1, oauthStateTtlMinutes: 10, passwordResetTokenTtlMinutes: 15, rememberMeDays: 30 },
  lockout: { maxFailureAttempts: 5, lockoutDurationMinutes: 15, failureWindowMinutes: 15 },
  password: { passwordMinLength: ADMIN_AUTH_POLICY_CONFIG.passwordMinLength, passwordMaxLength: ADMIN_AUTH_POLICY_CONFIG.passwordMaxLength, passwordMaxBytes: ADMIN_AUTH_POLICY_CONFIG.passwordMaxBytes, passwordRequiresSpecialChar: ADMIN_AUTH_POLICY_CONFIG.passwordRequiresSpecialChar, passwordRequiresNumbers: ADMIN_AUTH_POLICY_CONFIG.passwordRequiresNumbers, passwordRequiresUppercase: ADMIN_AUTH_POLICY_CONFIG.passwordRequiresUppercase, expirationDays: 90, changeDeferDays: 30, historyLimit: 3 },
  twoFactor: { enabled: ADMIN_AUTH_POLICY_CONFIG.twoFactorEnabled, required: ADMIN_AUTH_POLICY_CONFIG.twoFactorRequired, digits: ADMIN_AUTH_POLICY_CONFIG.twoFactorDigits, periodSeconds: 30, windowSteps: 1, challengeTtlSeconds: 300 },
  identityVerification: { maxRetries: 2, retryDelayMilliseconds: 200, retryMaxDelayMilliseconds: 10_000, retryBackoffFactor: 2, retryJitterEnabled: false },
  integrations: {
    httpRequestTimeoutSeconds: 5,
    notificationProviderRequestTimeoutSeconds: 10,
    oauthIconMaxSizeBytes: 2 * 1024 * 1024,
    oauthIconPresignedUrlTtlSeconds: 300,
    pushMessageTtlMinutes: 60,
    smtp: { connectionTimeoutSeconds: 10, greetingTimeoutSeconds: 10, socketTimeoutSeconds: 15 },
  },
  rateLimit: { windowMs: 60_000, maxRequests: 40, blockDurationMilliseconds: 60_000 },
} as const;

export const ADMIN_RUNTIME_CONFIG = {
  staticAssetsCacheMaxAgeSeconds: 86_400,
  storage: { localDirectory: 'data/uploads', publicUrlPrefix: '/api/v1/uploads', uploadUrlPrefix: '/api/v1/uploads' },
  logs: { averageDurationSampleSize: 1_000 },
  oauthIconCacheMaxAgeSeconds: 86_400,
} as const;
