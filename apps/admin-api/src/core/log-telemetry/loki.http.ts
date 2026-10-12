import { httpClient } from '#/core/http/http-client';

export async function queryLoki<T>(url: string) {
  const response = await httpClient.get<T>(url, { headers: { Accept: 'application/json' } });
  return { status: response.status, data: response.data };
}
