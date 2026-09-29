import { API_BASE_PATH, API_PREFIX, API_VERSION } from '@pkg/shared/common';

export const SERVICE_ID = 'service-api';
export const MACHINE_ALLOWED_LIST = ['admin-api'];
export { API_PREFIX, API_VERSION };
export const SECURITY_CONFIG = {
  request: {
    bodyMaxSizeBytes: 10 * 1024 * 1024,
    trustProxy: true,
  },
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
  registration: {
    allowRegistration: true,
    allowCredentialRegistration: true,
    requireEmailVerification: true,
    requireIdentityVerification: false,
    emailVerificationTokenTtlMinutes: 15,
  },
  session: {
    cookieName: 'session',
  },
  token: {
    revokeOnLogin: false,
    refreshCookieName: 'service_refresh_token',
    refreshIdleTimeoutMinutes: 30,
    accessTokenTtlMinutes: 10,
    machineTokenTtlMinutes: 1,
    oauthStateTtlMinutes: 10,
    passwordResetTokenTtlMinutes: 15,
    rememberMeDays: 30,
  },
  lockout: {
    maxFailureAttempts: 5,
    lockoutDurationMinutes: 15,
    failureWindowMinutes: 15,
  },
  password: {
    minLength: 8,
    maxLength: 256,
    maxBytes: 256,
    requireSpecialChar: true,
    requireNumbers: true,
    requireUppercase: false,
    expirationDays: 90,
    changeDeferDays: 30,
    historyLimit: 3,
  },
  twoFactor: {
    enabled: true,
    required: false,
    codeLength: 6,
    periodSeconds: 30,
    windowSteps: 1,
  },
  identityVerification: {
    requestTimeoutSeconds: 5,
    maxRetries: 2,
    retryDelayMilliseconds: 200,
    retryMaxDelayMilliseconds: 10_000,
    retryBackoffFactor: 2,
    retryJitterEnabled: false,
  },
  integrations: {
    internalServiceRequestTimeoutSeconds: 10,
    oauthProviderRequestTimeoutSeconds: 5,
    holidayCalendarRequestTimeoutSeconds: 6,
    webhookRequestTimeoutSeconds: 5,
    deliveryProviderRequestTimeoutSeconds: 10,
    oauthIconMaxSizeBytes: 2 * 1024 * 1024,
    oauthIconPresignedUrlTtlSeconds: 300,
    pushMessageTtlMinutes: 60,
    smtp: {
      connectionTimeoutSeconds: 10,
      greetingTimeoutSeconds: 10,
      socketTimeoutSeconds: 15,
    },
  },
  rateLimit: {
    windowMs: 60_000,
    maxRequests: 1000,
    blockDurationMilliseconds: 60_000,
    authenticationWindowMs: 60_000,
    authenticationMaxRequests: 10,
    recoveryWindowMs: 60_000,
    recoveryMaxRequests: 5,
  },
} as const;

export const SERVICE_RUNTIME_CONFIG = {
  systemConfigCacheTtlMilliseconds: 5_000,
  staticAssetsCacheMaxAgeSeconds: 86_400,
  storage: {
    localDirectory: 'data/uploads',
    publicUrlPrefix: `${API_BASE_PATH}/uploads`,
    uploadUrlPrefix: `${API_BASE_PATH}/uploads`,
  },
  support: {
    unansweredCheckIntervalMinutes: 1,
    autoCloseCheckIntervalMinutes: 10,
  },
} as const;

export { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_PAGE, PAGINATION_MAX_LIMIT } from '@pkg/shared/common';
