import { SERVICE_ID } from '#/app.config';

export const SessionKvStoreKey = {
  session: (id: string) => `${SERVICE_ID}:auth_session:${id}`,
} as const;
