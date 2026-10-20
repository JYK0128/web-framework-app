import { createSessionRequestHandler } from '@pkg/web-core/runtime/session';

import { serverEnvSchema } from '#/lib/server-env';

let handler: ReturnType<typeof createSessionRequestHandler> | undefined;

export function handleSessionRequest(request: Request): Promise<Response> {
  if (!handler) {
    const env = serverEnvSchema.parse(process.env);
    handler = createSessionRequestHandler({
      backend: env.API_BASE_URL,
      appBaseUrl: env.APP_BASE_URL,
      appName: env.APP_NAME,
      password: env.SESSION_SECRET,
      secure: env.NODE_ENV === 'production',
    });
  }

  return handler(request);
}
