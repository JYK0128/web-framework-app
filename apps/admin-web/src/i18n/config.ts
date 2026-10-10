import type { CreateI18nOptions } from '@pkg/shared/common';

import en from '#/i18n/locales/en';
import ko from '#/i18n/locales/ko';

export const locales = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
] as const;

export type AppLocale = (typeof locales)[number]['code'];
export const defaultLocale: AppLocale = 'en';

export const i18nOptions = {
  fallbackLng: defaultLocale,
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
  supportedLngs: locales.map(({ code }) => code),
} satisfies CreateI18nOptions;
