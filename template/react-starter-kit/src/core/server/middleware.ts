import { createCsrfMiddleware, createMiddleware } from '@tanstack/react-start';
import { getCookie, getRequestHeaders } from '@tanstack/react-start/server';

import { env } from '#/core/config/env';
import { applySecurityHeaders } from '#/core/server/security-header';
import { createSecurityNonce } from '#/core/server/security-nonce';

// Extracts locale from request cookies and attaches to context
const localeMiddleware = createMiddleware().server(async ({ next }) => {
  const langCookie = getCookie(env.I18N_COOKIE_NAME);
  const locale = langCookie || 'en';

  return next({ context: { locale } });
});

// Extracts browser/client environment info (User-Agent, Host, Client IP) and attaches to context
const browserMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders();
  const userAgent = headers.get('user-agent');
  const host = headers.get('host');
  const ip = headers.get('x-forwarded-for')?.split(',')[0].trim() ?? headers.get('x-real-ip');

  return next({ context: { userAgent, host, ip } });
});

// Blocks unsafe server function requests that do not satisfy CSRF checks.
const csrfMiddleware = createCsrfMiddleware({
  filter: ({ handlerType, request }) =>
    handlerType === 'serverFn' && request.method !== 'GET' && request.method !== 'HEAD',
});

// Adds per-request CSP nonce and security headers to every non-redirect response.
const securityMiddleware = createMiddleware().server(async ({ next }) => {
  const nonce = createSecurityNonce();
  const result = await next({ context: { cspNonce: nonce } });

  return {
    ...result,
    response: applySecurityHeaders(result.response, nonce),
  };
});

export const startMiddlewares = [
  localeMiddleware,
  browserMiddleware,
  csrfMiddleware,
  securityMiddleware,
] as const;
