import { SERVICE_ID } from '#/app.config';

export const TwoFactorLoginKvStoreKey = {
  challenge: (challenge: string) => `${SERVICE_ID}:auth_2fa_login_challenge:${challenge}`,
} as const;
