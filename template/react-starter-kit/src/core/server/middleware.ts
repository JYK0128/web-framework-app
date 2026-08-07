import { createCsrfMiddleware, createMiddleware } from '@tanstack/react-start';
import { getCookie, getRequestHeaders } from '@tanstack/react-start/server';

import { serverEnv } from '#/core/config/server-env';
import { applySecurityHeaders } from '#/core/server/security-header';
import { createSecurityNonce } from '#/core/server/security-nonce';

const SUPPORTED_LOCALES = ['ko', 'en'] as const;

function resolveLocale(pathname: string, langCookie?: string, acceptLanguage?: string | null): string {
  const pathSeg = /^\/([^/]+)/.exec(pathname)?.[1];
  if (pathSeg && (SUPPORTED_LOCALES as readonly string[]).includes(pathSeg)) return pathSeg;
  if (langCookie && (SUPPORTED_LOCALES as readonly string[]).includes(langCookie)) return langCookie;
  if (acceptLanguage?.includes('ko')) return 'ko';
  if (acceptLanguage?.includes('en')) return 'en';
  return 'en';
}

// Extracts browser/client environment info (User-Agent, Host, Client IP, URL, Method, Headers, Cookie) and attaches to context
const requestMiddleware = createMiddleware().server(async ({ next, request }) => {
  const headers = getRequestHeaders();
  const url = new URL(request.url);

  const userAgent = headers.get('user-agent');
  const host = headers.get('host');
  const ip = headers.get('x-forwarded-for')?.split(',')[0].trim() ?? headers.get('x-real-ip');
  const acceptLanguage = headers.get('accept-language');
  const referer = headers.get('referer');
  const langCookie = getCookie(serverEnv.I18N_COOKIE_NAME);
  const locale = resolveLocale(url.pathname, langCookie, acceptLanguage);

  return next({
    context: {
      url,
      method: request.method,
      userAgent,
      host,
      ip,
      referer,
      locale,
    },
  });
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
  requestMiddleware,
  csrfMiddleware,
  securityMiddleware,
] as const;
