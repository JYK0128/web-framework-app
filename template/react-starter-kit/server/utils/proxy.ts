import { defineEventHandler, getCookie, getRequestURL, type H3Event, proxyRequest } from 'nitro/h3';

import { getEnv } from '../env';
import { SESSION_COOKIE } from '../session/constants';

export type BackendResponseHandler = (
  event: H3Event,
  response: Response,
  currentSessionId?: string,
) => void | Promise<void>;

async function runResponseHandler(
  handler: BackendResponseHandler,
  event: H3Event,
  response: Response,
  sessionId?: string,
): Promise<void> {
  try {
    await handler(event, response, sessionId);
  }
  catch (error) {
    console.error('[session] Failed to synchronize session', error);
  }
}

export function createProxyHandler(onResponse?: BackendResponseHandler) {
  return defineEventHandler(async (event) => {
    const backendUrl = getEnv().BACKEND_URL.replace(/\/$/, '');

    const requestUrl = getRequestURL(event);
    const target = new URL(`${requestUrl.pathname}${requestUrl.search}`, `${backendUrl}/`).toString();
    const accessToken = event.context.accessToken as string | null | undefined;
    const sessionId = onResponse ? getCookie(event, SESSION_COOKIE) : undefined;
    const responseHandler = onResponse
      ? (responseEvent: H3Event, response: Response) => runResponseHandler(onResponse, responseEvent, response, sessionId)
      : undefined;

    const proxiedResponse = await proxyRequest(event, target, {
      filterHeaders: ['authorization', 'cookie'],
      headers: accessToken
        ? { authorization: `Bearer ${accessToken}` }
        : undefined,
      fetchOptions: { redirect: 'manual' },
      onResponse: responseHandler,
    });

    return proxiedResponse;
  });
}
