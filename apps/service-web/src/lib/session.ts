import { createSessionRequestHandler } from '@pkg/web-core/runtime/session';

export const handleSessionRequest = createSessionRequestHandler({
  backend: process.env.API_BASE_URL!,
  appBaseUrl: process.env.APP_BASE_URL!,
  appName: process.env.APP_NAME!,
  password: process.env.SESSION_SECRET!,
  secure: process.env.NODE_ENV === 'production',
});
