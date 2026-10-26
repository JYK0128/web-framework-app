import { useSession } from '@tanstack/react-start/server';

import { type SessionData, SessionProxy } from './session-proxy';

export type SessionHandlerOptions = {
  backend: string
  appBaseUrl: string
  appName: string
  password: string
  secure: boolean
};

export function createSessionRequestHandler({ backend, appBaseUrl, appName, password, secure }: SessionHandlerOptions) {
  const sessionProxy = new SessionProxy({
    backend,
    origin: new URL(appBaseUrl).origin,
    appName,
    secure,
    idleSeconds: 30 * 60,
    rememberSeconds: 30 * 24 * 60 * 60,
  });

  return async function handleSessionRequest(request: Request): Promise<Response> {
    const config = {
      name: sessionProxy.cookieName,
      password,
      maxAge: 30 * 24 * 60 * 60,
      sessionHeader: false as const,
      cookie: { httpOnly: true, sameSite: 'lax' as const, secure, path: '/' },
    };
    const session = await useSession<Partial<SessionData>>(config);
    const response = await sessionProxy.handle(request, {
      data: session.data,
      clear: () => session.clear(),
      update: async (data) => {
        await session.clear();
        const next = await useSession<Partial<SessionData>>({ ...config, maxAge: data.ttlSeconds });
        await next.update(data);
      },
    });
    if (!session.data.accessToken) await session.clear();
    return response;
  };
}

export { type SessionData, SessionProxy } from './session-proxy';
