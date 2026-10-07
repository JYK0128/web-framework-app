import { createI18n } from '@pkg/shared/common';
import * as i18nextHttpMiddleware from 'i18next-http-middleware';

import en from '#/locales/en.json';
import ko from '#/locales/ko.json';

export function createI18nMiddleware() {
  const i18n = createI18n({
    modules: [i18nextHttpMiddleware.LanguageDetector],
    detection: { order: ['header'], caches: [] },
    resources: { en: { translation: en }, ko: { translation: ko } },
  });
  return i18nextHttpMiddleware.handle(i18n);
}
