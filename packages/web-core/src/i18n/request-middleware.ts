import { createI18n, type CreateI18nOptions } from '@pkg/shared/common';
import { createMiddleware } from '@tanstack/react-start';
import { LanguageDetector as HttpLanguageDetector } from 'i18next-http-middleware';

type RequestLanguageDetector = {
  detect(request: unknown, response: undefined): string | string[] | undefined
};

export function createI18nRequestMiddleware(options: CreateI18nOptions) {
  const serverI18n = createI18n({
    ...options,
    modules: [HttpLanguageDetector],
    detection: {
      order: ['path', 'cookie', 'header'],
      convertDetectedLanguage: (language) => language.split('-')[0],
    },
  });

  return createMiddleware().server(async ({ request, next }) => {
    const url = new URL(request.url);
    const detector = serverI18n.services.languageDetector as RequestLanguageDetector;
    const detected = detector.detect({
      url: `${url.pathname}${url.search}`,
      headers: Object.fromEntries(request.headers.entries()),
    }, undefined);
    const language = Array.isArray(detected) ? detected[0] : detected;
    const requestI18n = serverI18n.cloneInstance({ initAsync: false });
    if (language) await requestI18n.changeLanguage(language);

    const result = await next({ context: { i18n: requestI18n } });
    const resolvedLanguage = requestI18n.resolvedLanguage ?? requestI18n.language;
    if (resolvedLanguage) result.response.headers.set('Content-Language', resolvedLanguage);
    return result;
  });
}
