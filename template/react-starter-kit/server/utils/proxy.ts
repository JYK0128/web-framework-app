import { defineEventHandler, getRequestURL, proxyRequest } from 'nitro/h3';

import { getEnv } from '~/env';

export function createProxyHandler() {
  return defineEventHandler(async (event) => {
    const backendUrl = getEnv().BACKEND_URL.replace(/\/$/, '');

    const requestUrl = getRequestURL(event);
    const target = new URL(`${requestUrl.pathname}${requestUrl.search}`, `${backendUrl}/`).toString();

    return proxyRequest(event, target, {
      filterHeaders: ['authorization'],
      fetchOptions: {
        redirect: 'manual',
      },
    });
  });
}
