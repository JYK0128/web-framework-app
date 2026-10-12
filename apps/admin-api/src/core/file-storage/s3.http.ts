import { httpClient } from '#/core/http/http-client';

export async function putS3Object(url: string, body: Buffer, headers: Record<string, string>) {
  const response = await httpClient.put<string>(url, body, { headers });
  return { status: response.status, data: response.data };
}

export async function getS3Object(url: string, headers: Record<string, string>) {
  const response = await httpClient.get<ArrayBuffer>(url, { headers, responseType: 'arraybuffer' });
  return { status: response.status, data: response.data };
}
