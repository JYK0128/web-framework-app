import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/auth';
import { MACHINE_TOKEN_TTL_MINUTES } from '@pkg/shared/server';

export const SERVICE_ID = 'service-api';
export const MACHINE_ALLOWED_LIST = ['admin-api'];
export const SECURITY_CONFIG = {
  request: { bodyMaxSizeBytes: 10 * 1024 * 1024, trustProxy: true },
  credentialAvailable: SERVICE_AUTH_POLICY_CONFIG.credentialAvailable,
  oauthAvailable: SERVICE_AUTH_POLICY_CONFIG.oauthAvailable,
  cookie: { secure: process.env.NODE_ENV === 'production', sameSite: 'lax' },
  registration: { oauthDefaultRoleCode: 'member', allowRegistration: SERVICE_AUTH_POLICY_CONFIG.registrationAvailable, requireEmailVerification: SERVICE_AUTH_POLICY_CONFIG.emailVerificationRequired, requirePhoneNumberVerification: SERVICE_AUTH_POLICY_CONFIG.phoneNumberVerificationRequired, emailVerificationTokenTtlMinutes: 15 },
  session: { cookieName: 'session' },
  token: { revokeOnLogin: false, refreshCookieName: 'service_refresh_token', refreshIdleTimeoutMinutes: 30, accessTokenTtlMinutes: 10, machineTokenTtlMinutes: MACHINE_TOKEN_TTL_MINUTES, oauthStateTtlMinutes: 10, passwordResetTokenTtlMinutes: 15, rememberMeDays: 30 },
  lockout: { maxFailureAttempts: 5, lockoutDurationMinutes: 15, failureWindowMinutes: 15 },
  password: { minLength: SERVICE_AUTH_POLICY_CONFIG.passwordMinLength, maxLength: SERVICE_AUTH_POLICY_CONFIG.passwordMaxLength, maxBytes: SERVICE_AUTH_POLICY_CONFIG.passwordMaxBytes, requireSpecialChar: SERVICE_AUTH_POLICY_CONFIG.passwordRequiresSpecialChar, requireNumbers: SERVICE_AUTH_POLICY_CONFIG.passwordRequiresNumbers, requireUppercase: SERVICE_AUTH_POLICY_CONFIG.passwordRequiresUppercase, expirationDays: 90, changeDeferDays: 30, historyLimit: 3 },
  twoFactor: { enabled: SERVICE_AUTH_POLICY_CONFIG.twoFactorEnabled, required: SERVICE_AUTH_POLICY_CONFIG.twoFactorRequired, digits: SERVICE_AUTH_POLICY_CONFIG.twoFactorDigits, periodSeconds: 30, windowSteps: 1, challengeTtlSeconds: 300 },
  identityVerification: { requestTimeoutSeconds: 5, maxRetries: 2, retryDelayMilliseconds: 200, retryMaxDelayMilliseconds: 10_000, retryBackoffFactor: 2, retryJitterEnabled: false },
  integrations: {
    internalServiceRequestTimeoutSeconds: 10,
    oauthProviderRequestTimeoutSeconds: 5,
    holidayCalendarRequestTimeoutSeconds: 6,
    webhookRequestTimeoutSeconds: 5,
    deliveryProviderRequestTimeoutSeconds: 10,
    oauthIconMaxSizeBytes: 2 * 1024 * 1024,
    oauthIconPresignedUrlTtlSeconds: 300,
    pushMessageTtlMinutes: 60,
    smtp: { connectionTimeoutSeconds: 10, greetingTimeoutSeconds: 10, socketTimeoutSeconds: 15 },
  },
  rateLimit: { windowMs: 60_000, maxRequests: 40, blockDurationMilliseconds: 60_000 },
} as const;

export const SERVICE_RUNTIME_CONFIG = {
  systemConfigCacheTtlMilliseconds: 5_000,
  staticAssetsCacheMaxAgeSeconds: 86_400,
  storage: { localDirectory: 'data/uploads', publicUrlPrefix: '/api/v1/uploads', uploadUrlPrefix: '/api/v1/uploads' },
  support: { unansweredCheckIntervalMinutes: 1, autoCloseCheckIntervalMinutes: 10 },
} as const;
