// Purpose format: <scope>/<feature>/<operation>/v1.
export const SECRET_KEY_PURPOSE = {
  sessionSigning: 'template/auth/session-signing/v1',
  systemConfigEncryption: 'template/config/system-secret-encryption/v1',
  verificationEncryption: 'template/auth/verification-encryption/v1',
  twoFactorEncryption: 'template/auth/two-factor-encryption/v1',
  emailLogHmac: 'template/logging/email-hmac/v1',
} as const;
