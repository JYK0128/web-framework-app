import { ApplicationError, createI18n } from '@pkg/shared/common';
import type { Register } from '@tanstack/react-router';
import { createCsrfMiddleware, createMiddleware, createStart } from '@tanstack/react-start';
import type { i18n } from 'i18next';
import { LanguageDetector as HttpLanguageDetector } from 'i18next-http-middleware';

import { i18nOptions } from './configs/i18n.config';

type RequestLanguageDetector = {
  detect(request: unknown, response: undefined): string | string[] | undefined
};

const serverI18n = createI18n({
  ...i18nOptions,
  modules: [HttpLanguageDetector],
  detection: {
    order: ['path', 'cookie', 'header'],
    convertDetectedLanguage: (language) => language.split('-')[0],
  },
});

async function createRequestI18n(request: Request): Promise<i18n> {
  const url = new URL(request.url);
  const detector = serverI18n.services.languageDetector as RequestLanguageDetector;
  const detected = detector.detect({
    url: `${url.pathname}${url.search}`,
    headers: Object.fromEntries(request.headers.entries()),
  }, undefined);
  const language = Array.isArray(detected) ? detected[0] : detected;
  const requestI18n = serverI18n.cloneInstance({ initAsync: false });
  if (language) await requestI18n.changeLanguage(language);
  return requestI18n;
}

const i18nMiddleware = createMiddleware().server(async ({ request, next }) => {
  const i18n = await createRequestI18n(request);
  const result = await next({ context: { i18n } });

  const language = i18n.resolvedLanguage ?? i18n.language;
  if (language) result.response.headers.set('Content-Language', language);

  return result;
});

const csrfMiddleware = createCsrfMiddleware<Register, [typeof i18nMiddleware]>({
  filter: ({ request }) => new URL(request.url).pathname.startsWith('/api/')
    && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
  secFetchSite: ['same-origin', 'none'],
  allowRequestsWithoutOriginCheck: false,
  failureResponse: ({ request, context }) => {
    const url = new URL(request.url);
    const body = new ApplicationError({ code: 'CSRF_VALIDATION_FAILED', status: 403 }).toJSON({
      path: `${url.pathname}${url.search}`,
      requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
      i18n: context.i18n,
    });
    return Response.json(body, { status: body.statusCode, headers: { 'x-request-id': body.requestId } });
  },
});

export const startInstance = createStart(() => ({
  requestMiddleware: [i18nMiddleware, csrfMiddleware],
}));
