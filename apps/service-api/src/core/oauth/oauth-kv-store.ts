import { SERVICE_ID } from '#/app.config';

export const OAuthKvStoreKey = {
  state: (hash: string) => `${SERVICE_ID}:auth_oauth_state:${hash}`,
} as const;
