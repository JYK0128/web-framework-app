import { hash } from '@pkg/shared/server';

import { SERVICE_ID } from '~/app.config';

export const AuthKvStoreKey = {
  emailVerificationChallenge: (challengeId: string) => `${SERVICE_ID}:auth_email_verification:${challengeId}`,
  passwordResetChallenge: (challengeId: string) => `${SERVICE_ID}:auth_password_reset:${challengeId}`,
  twoFactorLoginChallenge: (token: string) => `${SERVICE_ID}:auth_2fa_login_challenge:${hash(token)}`,
} as const;
