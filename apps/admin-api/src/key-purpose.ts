// Purpose format: <scope>/<feature>/<operation>/v1.
export const SECRET_KEY_PURPOSE = {
  userJwtSigning: 'apps/auth/user-jwt-signing/v1',
  machineJwtSigning: 'apps/auth/machine-jwt-signing/v1',
  sessionSigning: 'apps/auth/session-signing/v1',
  twoFactorEncryption: 'apps/auth/two-factor-encryption/v1',
  adminEmailEncryption: 'apps/admin/email-delivery-encryption/v1',
  piiEncryption: 'apps/pii/encryption/v1',
  piiSearchHmac: 'apps/pii/search-hmac/v1',
} as const;
