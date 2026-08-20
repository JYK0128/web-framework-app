import { defineEventHandler } from 'nitro/h3';

import { createProxyHandler } from '../../../../utils/proxy';

const proxyHandler = createProxyHandler();

function withRedirect(response: Response, location: string): Response {
  const headers = new Headers(response.headers);
  headers.set('location', location);
  headers.delete('content-length');
  return new Response(null, { status: 302, headers });
}

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

  const authResult = data as Record<string, unknown>;
  if (typeof authResult.challengeId === 'string') {
    return withRedirect(
      response,
      `/login/2fa?challengeId=${encodeURIComponent(authResult.challengeId)}`,
    );
  }

  return authResult.ok === true ? withRedirect(response, '/dashboard') : response;
});
