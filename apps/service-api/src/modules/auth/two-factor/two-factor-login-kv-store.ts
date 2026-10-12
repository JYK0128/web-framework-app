import { SERVICE_ID } from '#/app.config';

export const TwoFactorLoginKvStoreKey = {
  challenge: (challenge: string) => `${SERVICE_ID}:auth_two_factor_login_challenge:${challenge}`,
} as const;
