import { httpClient } from '#/core/http/http-client';

export async function postNotificationJson(url: string, headers: Record<string, string>, body: Record<string, unknown>) {
  return httpClient.post<unknown>(url, body, { headers });
}

export async function postNotificationForm<T>(url: string, headers: Record<string, string>, body: string | URLSearchParams): Promise<{ status: number, data: T }> {
  const response = await httpClient.post<T>(url, body, { headers });
  return { status: response.status, data: response.data };
}

export async function getNotification<T>(url: string): Promise<{ status: number, data: T }> {
  const response = await httpClient.get<T>(url);
  return { status: response.status, data: response.data };
}
