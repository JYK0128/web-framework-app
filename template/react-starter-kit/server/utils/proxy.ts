import { defineEventHandler, deleteCookie, getCookie, getRequestURL, type H3Event, proxyRequest, setCookie } from 'nitro/h3';

import { getEnv } from '../env';
import { COOKIE_OPTIONS, SESSION_COOKIE } from '../session/constants';
import { getSession } from '../session/storage.server';
import { forceRefreshSession } from './session';

export type BackendResponseHandler = (
  event: H3Event,
  response: Response,
  currentSessionId?: string,
) => void | Promise<void>;

export type BackendRequestBodyProvider = (
  event: H3Event,
) => string | undefined | Promise<string | undefined>;

export type ProxyHandlerOptions = {
  retryOnUnauthorized?: boolean
};

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

export function createProxyHandler(
  onResponse?: BackendResponseHandler,
  requestBodyProvider?: BackendRequestBodyProvider,
  options: ProxyHandlerOptions = {},
) {
  return defineEventHandler(async (event) => {
    const backendUrl = getEnv().BACKEND_URL.replace(/\/$/, '');

    const requestUrl = getRequestURL(event);
    const target = new URL(`${requestUrl.pathname}${requestUrl.search}`, `${backendUrl}/`).toString();
    const accessToken = event.context.accessToken as string | null | undefined;
    const sessionId = getCookie(event, SESSION_COOKIE);
    const requestBody = requestBodyProvider ? await requestBodyProvider(event) : undefined;
    const responseHandler = onResponse
      ? (responseEvent: H3Event, response: Response) => runResponseHandler(onResponse, responseEvent, response, sessionId)
      : undefined;

    const proxy = () => proxyRequest(event, target, {
      filterHeaders: ['authorization', 'cookie'],
      headers: event.context.accessToken
        ? { authorization: `Bearer ${event.context.accessToken as string}` }
        : undefined,
      fetchOptions: {
        redirect: 'manual',
        credentials: 'omit',
        ...(requestBody === undefined ? {} : { body: requestBody }),
      },
      onResponse: responseHandler,
    });

    let proxiedResponse = await proxy();
    if (options.retryOnUnauthorized && proxiedResponse.status === 401 && sessionId && accessToken) {
      const refreshedSession = await forceRefreshSession(
        backendUrl,
        sessionId,
        await getSession(sessionId),
        accessToken,
      );

      if (refreshedSession) {
        event.context.accessToken = refreshedSession.accessToken;
        setCookie(event, SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
        proxiedResponse = await proxy();
      }
      else if (refreshedSession === null) {
        deleteCookie(event, SESSION_COOKIE, COOKIE_OPTIONS);
      }
    }

    return proxiedResponse;
  });
}
