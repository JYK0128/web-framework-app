import { AUTH_REFRESH_PATH } from '../session/constants';
import { clearSession, saveSession, type Session } from '../session/storage.server';

function isAccessTokenExpired(token: string, leewaySeconds = 15): boolean {
  const encodedPayload = token.split('.')[1];
  if (!encodedPayload) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as { exp?: unknown };
    return typeof payload.exp === 'number' && payload.exp <= Date.now() / 1000 + leewaySeconds;
  }
  catch {
    return false;
  }
}

async function refreshSession(backendUrl: string, refreshToken: string): Promise<Session | null> {
  const response = await fetch(new URL(AUTH_REFRESH_PATH, `${backendUrl}/`), {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return null;

  const envelope = await response.json() as { data?: unknown };
  if (!envelope.data || typeof envelope.data !== 'object') return null;

  const data = envelope.data as Record<string, unknown>;
  if (typeof data.accessToken !== 'string' || typeof data.refreshToken !== 'string') return null;

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

export async function getActiveSession(
  backendUrl: string,
  sessionId: string | undefined,
  session: Session | null,
): Promise<Session | null> {
  if (!sessionId || !session || !session.accessToken || !session.refreshToken) {
    if (sessionId && session) await clearSession(sessionId);
    return null;
  }

  if (isAccessTokenExpired(session.accessToken)) {
    const refreshedSession = await refreshSession(backendUrl, session.refreshToken);
    if (!refreshedSession) {
      await clearSession(sessionId);
      return null;
    }

    await saveSession(sessionId, refreshedSession);
    return refreshedSession;
  }

  await saveSession(sessionId, session);
  return session;
}
