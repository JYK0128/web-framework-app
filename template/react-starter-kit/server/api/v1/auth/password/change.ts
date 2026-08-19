import { defineEventHandler } from 'nitro/h3';

import { saveSession } from '../../../../session/storage.server';
import { createProxyHandler } from '../../../../utils/proxy';

const proxyHandler = createProxyHandler(async (event, response, currentSessionId) => {
  if (!response.ok || !currentSessionId) return;

  const envelope = await response.clone().json() as { data?: unknown };
  if (!envelope.data || typeof envelope.data !== 'object') return;

  const data = envelope.data as Record<string, unknown>;
  if (typeof data.accessToken !== 'string' || typeof data.refreshToken !== 'string') return;

  await saveSession(currentSessionId, {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
}, undefined, { retryOnUnauthorized: true });

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
  if (typeof tokenData.accessToken !== 'string' || typeof tokenData.refreshToken !== 'string') return response;

  return new Response(JSON.stringify({ ...body, data: { ok: true } }), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
});
