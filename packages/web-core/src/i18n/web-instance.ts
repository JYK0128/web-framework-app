import { createI18n, type CreateI18nOptions } from '@pkg/shared/common';
import { createIsomorphicFn, getGlobalStartContext } from '@tanstack/react-start';
import type { i18n } from 'i18next';
import BrowserLanguageDetector from 'i18next-browser-languagedetector';

export function createWebI18n(options: CreateI18nOptions) {
  const clientI18n = createI18n({
    ...options,
    modules: [BrowserLanguageDetector],
    detection: {
      order: ['path', 'cookie', 'htmlTag', 'navigator'],
      caches: ['cookie'],
      cookieMinutes: 525600,
      cookieOptions: { path: '/', sameSite: 'lax' },
      convertDetectedLanguage: (language) => language.split('-')[0],
    },
  });

  return {
    getI18n: createIsomorphicFn()
      .server(() => {
        const context = getGlobalStartContext() as { i18n?: i18n } | undefined;
        if (!context?.i18n) throw new Error('i18n request middleware is missing');
        return context.i18n;
      })
      .client(() => clientI18n),
  };
}
