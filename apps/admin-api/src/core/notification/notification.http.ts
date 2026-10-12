import { httpClient } from '#/core/http/http-client';

import type { ProviderHttpResponse } from './provider-response';

function toProviderResponse(response: { status: number, data: unknown }): ProviderHttpResponse {
  return { ok: response.status >= 200 && response.status < 300, status: response.status, body: response.data };
}

export async function postNotificationJson(url: string, headers: Record<string, string>, body: Record<string, unknown>): Promise<ProviderHttpResponse> {
  return toProviderResponse(await httpClient.post<unknown>(url, body, { headers }));
}

export async function postNotificationForm<T>(url: string, headers: Record<string, string>, body: string | URLSearchParams): Promise<{ status: number, data: T }> {
  const response = await httpClient.post<T>(url, body, { headers });
  return { status: response.status, data: response.data };
}

export async function getNotification<T>(url: string): Promise<{ status: number, data: T }> {
  const response = await httpClient.get<T>(url);
  return { status: response.status, data: response.data };
}
