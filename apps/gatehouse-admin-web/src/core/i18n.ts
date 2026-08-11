import { createI18n } from '@pkg/shared/common';
import { BrowserLanguageDetector } from '@pkg/shared/web';

import { i18nOptions } from './i18n.config';

export function createClientI18n() {
  return createI18n({
    ...i18nOptions,
    modules: [BrowserLanguageDetector],
    detection: {
      order: ['cookie', 'htmlTag', 'navigator'],
      caches: ['cookie'],
      cookieMinutes: 525600,
      cookieOptions: { path: '/', sameSite: 'lax' },
      convertDetectedLanguage: (language) => language.split('-')[0],
    },
  });
}
