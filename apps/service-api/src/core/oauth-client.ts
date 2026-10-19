import type { OAuthHttpRequest } from '@pkg/server-core/oauth/oauth-provider.interface';

import { httpClient } from '#/core/http-client';

export const oauthClient: { request: OAuthHttpRequest } = {
  request: async (url, init, options) => {
    const response = await httpClient.request<unknown>({
      url: String(url),
      method: init.method,
      headers: Object.fromEntries(new Headers(init.headers).entries()),
      data: init.body,
      signal: init.signal ?? undefined,
      ...(options?.preventRedirects ? { maxRedirects: 0 } : {}),
    });
    const body = response.status === 204 || response.status === 205 || response.status === 304
      ? null
      : JSON.stringify(response.data);
    return new Response(body, { status: response.status, headers: { 'Content-Type': 'application/json' } });
  },
};
