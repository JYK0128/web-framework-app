import type { AuthPolicyConfig } from './policy.types';

export const ADMIN_AUTH_POLICY_CONFIG = {
  registrationAvailable: false,
  credentialAvailable: true,
  oauthAvailable: false,
  emailVerificationRequired: false,
  phoneNumberVerificationRequired: false,
  passwordMinLength: 8,
  passwordMaxLength: 256,
  passwordMaxBytes: 256,
  passwordRequiresNumbers: true,
  passwordRequiresSpecialChar: true,
  passwordRequiresUppercase: false,
  twoFactorRequired: false,
  twoFactorEnabled: true,
  twoFactorDigits: 6,
} as const satisfies AuthPolicyConfig;
