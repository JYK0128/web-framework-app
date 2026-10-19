import { createSessionRequestHandler } from '@pkg/web-core/runtime/session';

import { getServerEnv } from '#/lib/server-env';

const env = getServerEnv();

export const handleSessionRequest = createSessionRequestHandler({
  backend: env.API_BASE_URL,
  appBaseUrl: env.APP_BASE_URL,
  appName: env.APP_NAME,
  password: env.SESSION_SECRET,
  secure: env.NODE_ENV === 'production',
});
