import { createI18n } from '@pkg/shared/common';
import { createIsomorphicFn, getGlobalStartContext } from '@tanstack/react-start';
import type { i18n } from 'i18next';
import BrowserLanguageDetector from 'i18next-browser-languagedetector';

import { i18nOptions } from '#/core/i18n.config';

export type { AppLocale } from '#/core/i18n.config';
export { defaultLocale, locales } from '#/core/i18n.config';

const clientI18n = createI18n({
  ...i18nOptions,
  modules: [BrowserLanguageDetector],
  detection: {
    order: ['path', 'cookie', 'htmlTag', 'navigator'],
    caches: ['cookie'],
    cookieMinutes: 525600,
    cookieOptions: { path: '/', sameSite: 'lax' },
    convertDetectedLanguage: (language) => language.split('-')[0],
  },
});

export const getI18n = createIsomorphicFn()
  .server(() => {
    const context = getGlobalStartContext() as { i18n?: i18n } | undefined;
    if (!context?.i18n) throw new Error('i18n request middleware is missing');
    return context.i18n;
  })
  .client(() => clientI18n);
