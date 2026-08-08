import { type i18n, type TFunction } from 'i18next';
import * as i18nextHttpMiddleware from 'i18next-http-middleware';

export type { TFunction };

export const HttpLanguageDetector = i18nextHttpMiddleware.LanguageDetector;

/**
 * Connects a server i18next instance to an Express-compatible request pipeline.
 */
export function createExpressI18nMiddleware(i18nInstance: i18n): ReturnType<typeof i18nextHttpMiddleware.handle> {
  return i18nextHttpMiddleware.handle(i18nInstance);
}
