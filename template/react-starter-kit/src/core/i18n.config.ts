import type { CreateI18nOptions } from '@pkg/shared/common';

import en from '#/core/locales/en';
import ko from '#/core/locales/ko';

export const locales = [
  { code: 'ko', label: '한국어', shortLabel: 'KO' },
  { code: 'en', label: 'English', shortLabel: 'EN' },
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
