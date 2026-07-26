/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import { createInstance, type i18n, type Resource } from 'i18next';
import * as i18nextHttpMiddleware from 'i18next-http-middleware';

import { I18N_COOKIE_NAME } from '#common/constants';
import { setZodLanguage } from '#common/zod';

export interface ServerI18nOptions {
  resources: Resource
}

/**
 * Creates a server-optimized i18next instance using official i18next-http-middleware.
 * Priority order: cookie -> header -> default fallback ('en')
 */
export async function createServerI18n(options: ServerI18nOptions): Promise<{ i18n: i18n, middleware: ReturnType<typeof i18nextHttpMiddleware.handle> }> {
  const instance = createInstance();

  await instance.use(i18nextHttpMiddleware.LanguageDetector).init({
    detection: {
      order: ['cookie', 'header'],
      lookupCookie: I18N_COOKIE_NAME,
      caches: false,
    },
    fallbackLng: 'en',
    resources: options.resources,
  } as any);

  // Synchronize detected language with Zod validation
  setZodLanguage(instance.language);
  instance.on('languageChanged', (lng) => {
    setZodLanguage(lng);
  });

  const middleware = i18nextHttpMiddleware.handle(instance);

  return {
    i18n: instance,
    middleware,
  };
}
