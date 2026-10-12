import { httpClient } from '#/core/http/http-client';

export async function postWebhook(url: string, payload: unknown): Promise<{ status: number, data: unknown }> {
  const response = await httpClient.post(url, payload);
  return { status: response.status, data: response.data };
}
