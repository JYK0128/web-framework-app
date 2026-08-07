import { createInstance, type i18n, InitOptions, type TFunction } from 'i18next';
import * as i18nextHttpMiddleware from 'i18next-http-middleware';

import { env } from '#common/env';
import { setZodLanguage } from '#common/zod';

export type { TFunction };

/**
 * Creates a server-optimized i18next instance using official i18next-http-middleware.
 * Priority order: cookie -> header -> default fallback ('en')
 */
export async function createServerI18n(options: InitOptions): Promise<{ i18n: i18n, middleware: ReturnType<typeof i18nextHttpMiddleware.handle> }> {
  const i18nInstance = createInstance();

  await i18nInstance.use(i18nextHttpMiddleware.LanguageDetector).init({
    fallbackLng: 'en',
    detection: {
      order: ['cookie', 'header'],
      lookupCookie: env.I18N_COOKIE_NAME,
      caches: false,
    },
    ...options,
  });

  setZodLanguage(i18nInstance.language);

  const middleware = i18nextHttpMiddleware.handle(i18nInstance);

  return {
    middleware,
    i18n: i18nInstance,
  };
}
