import { httpClient } from '#/core/http/http-client';

export async function requestOAuthProvider(url: string, init: RequestInit) {
  return httpClient.request<unknown>({
    url,
    method: init.method,
    headers: init.headers as Record<string, string> | undefined,
    data: init.body,
  });
}
