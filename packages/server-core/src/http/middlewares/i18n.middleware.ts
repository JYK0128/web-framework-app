import { createI18n } from '@pkg/shared/common';
import type { Resource } from 'i18next';
import * as i18nextHttpMiddleware from 'i18next-http-middleware';

export function createI18nMiddleware(resources: Resource) {
  const i18n = createI18n({
    modules: [i18nextHttpMiddleware.LanguageDetector],
    detection: { order: ['header'], caches: [] },
    resources,
  });
  return i18nextHttpMiddleware.handle(i18n);
}
