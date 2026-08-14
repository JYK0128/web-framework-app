import { randomBase64Url } from '@pkg/shared/server';
import { defineEventHandler, redirect, setCookie } from 'nitro/h3';

import { COOKIE_OPTIONS, SESSION_COOKIE } from '../../../../session/constants';
import { clearSession, saveSession } from '../../../../session/storage.server';
import { createProxyHandler } from '../../../../utils/proxy';

const proxyHandler = createProxyHandler(async (event, response, currentSessionId) => {
  if (!response.ok) return;

  const envelope = await response.clone().json() as { data?: unknown };
  if (!envelope.data || typeof envelope.data !== 'object') return;

  const data = envelope.data as Record<string, unknown>;
  if (typeof data.accessToken !== 'string' || typeof data.refreshToken !== 'string') return;

  await clearSession(currentSessionId);
  const sessionId = randomBase64Url();
  await saveSession(sessionId, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  setCookie(event, SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
});

export default defineEventHandler(async (event) => {
  const proxiedResponse = await proxyHandler(event);
  const response = new Response(proxiedResponse.body as string | null, {
    status: proxiedResponse.status,
    statusText: proxiedResponse.statusText,
    headers: proxiedResponse.headers,
  });
  if (!response.ok) return response;

  const body = await response.clone().json().catch(() => null) as Record<string, unknown> | null;
  const data = body?.data;
  if (!body || !data || typeof data !== 'object') return response;

  const tokenData = data as Record<string, unknown>;
  if (typeof tokenData.accessToken !== 'string' || typeof tokenData.refreshToken !== 'string') {
    if (typeof tokenData.challengeId === 'string') {
      return redirect(
        `/login/2fa?challengeId=${encodeURIComponent(tokenData.challengeId)}`,
        302,
      );
    }
    return response;
  }

  return redirect('/onboarding', 302);
});
