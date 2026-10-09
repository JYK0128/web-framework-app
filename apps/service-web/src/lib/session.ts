import { type SessionData, SessionProxy } from '@pkg/shared/server';
import { useSession } from '@tanstack/react-start/server';

const sessionProxy = new SessionProxy({
  backend: process.env.API_BASE_URL!,
  origin: new URL(process.env.APP_BASE_URL!).origin,
  appName: 'service',
  secure: process.env.NODE_ENV === 'production',
  idleSeconds: 30 * 60,
  rememberSeconds: 30 * 24 * 60 * 60,
});

export async function handleSessionRequest(request: Request): Promise<Response> {
  const config = {
    name: sessionProxy.cookieName,
    password: process.env.SESSION_SECRET!,
    maxAge: 30 * 24 * 60 * 60,
    sessionHeader: false as const,
    cookie: { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' },
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
}
