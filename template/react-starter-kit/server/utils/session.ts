import { AUTH_REFRESH_PATH } from '../session/constants';
import { clearSession, getSession, saveSession, type Session, withSessionRefreshLock } from '../session/storage.server';

const REFRESH_REQUEST_TIMEOUT_MS = 10_000;

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
    signal: AbortSignal.timeout(REFRESH_REQUEST_TIMEOUT_MS),
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

/**
 * 현재 access token이 서버에서 폐기된 경우에도 한 번만 refresh token을 회전합니다.
 * 다른 요청이 먼저 회전했다면 최신 세션을 그대로 반환합니다.
 */
export async function forceRefreshSession(
  backendUrl: string,
  sessionId: string,
  session: Session | null,
  failedAccessToken: string,
): Promise<Session | null | undefined> {
  if (!session?.accessToken || !session.refreshToken) {
    if (session) await clearSession(sessionId);
    return null;
  }

  const refreshedSession = await withSessionRefreshLock(sessionId, async () => {
    const latestSession = await getSession(sessionId);
    if (!latestSession) return null;
    if (latestSession.accessToken !== failedAccessToken) return latestSession;

    const rotatedSession = await refreshSession(backendUrl, latestSession.refreshToken);
    if (!rotatedSession) return null;

    await saveSession(sessionId, rotatedSession);
    return rotatedSession;
  });

  if (refreshedSession === undefined) return undefined;
  if (!refreshedSession) {
    await clearSession(sessionId);
    return null;
  }

  return refreshedSession;
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
    const refreshedSession = await withSessionRefreshLock(sessionId, async () => {
      // Another request may have completed rotation while this request was waiting
      // for the session lock. Never submit the consumed refresh token again.
      const latestSession = await getSession(sessionId);
      if (!latestSession) return null;
      if (latestSession.refreshToken !== session.refreshToken) return latestSession;
      if (!isAccessTokenExpired(latestSession.accessToken)) return latestSession;

      const rotatedSession = await refreshSession(backendUrl, latestSession.refreshToken);
      if (!rotatedSession) return null;

      await saveSession(sessionId, rotatedSession);
      return rotatedSession;
    });

    if (refreshedSession === undefined) return null;
    if (!refreshedSession) {
      await clearSession(sessionId);
      return null;
    }

    return refreshedSession;
  }

  await saveSession(sessionId, session);
  return session;
}
