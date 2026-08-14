import { createI18n } from '@pkg/shared/common';
import { HttpLanguageDetector } from '@pkg/shared/server';
import { createMiddleware } from '@tanstack/react-start';
import { castArray, head } from 'lodash-es';

import { i18nOptions } from '#/core/i18n.config';

type RequestLanguageDetector = {
  detect(request: unknown, response?: unknown): string | readonly string[] | undefined
};

const appI18n = createI18n({
  ...i18nOptions,
  modules: [HttpLanguageDetector],
  detection: {
    order: ['path', 'cookie', 'header'],
    convertDetectedLanguage: (language) => language.split('-')[0],
  },
});

export const i18nMiddleware = createMiddleware().server(async ({ request, next }) => {
  const url = new URL(request.url);
  const detectorRequest = {
    url: `${url.pathname}${url.search}`,
    headers: Object.fromEntries(request.headers.entries()),
  };

  const detector = appI18n.services.languageDetector as RequestLanguageDetector;
  const detectedLanguage = detector.detect(detectorRequest, undefined);
  const language = head(castArray<string | undefined>(detectedLanguage));
  const i18n = appI18n.cloneInstance({ initAsync: false });

  if (language) await i18n.changeLanguage(language);
  const result = await next({ context: { i18n, request } });
  const headers = new Headers(result.response.headers);
  const responseLanguage = i18n.resolvedLanguage ?? i18n.language;

  if (responseLanguage) headers.set('Content-Language', responseLanguage);

  return {
    ...result,
    response: new Response(result.response.body, {
      headers,
      status: result.response.status,
      statusText: result.response.statusText,
    }),
  };
});
