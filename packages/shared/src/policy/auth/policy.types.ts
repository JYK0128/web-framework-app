export interface AuthPolicyConfig {
  registrationAvailable: boolean
  credentialAvailable: boolean
  oauthAvailable: boolean
  emailVerificationRequired: boolean
  phoneNumberVerificationRequired: boolean
  passwordMinLength: number
  passwordMaxLength: number
  passwordMaxBytes: number
  passwordRequiresNumbers: boolean
  passwordRequiresSpecialChar: boolean
  passwordRequiresUppercase: boolean
  twoFactorRequired: boolean
  twoFactorEnabled: boolean
  twoFactorDigits: number
}
