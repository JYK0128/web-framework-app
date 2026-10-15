import type { CreateI18nOptions } from '@pkg/shared/common';
import { webCoreLocaleResources } from '@pkg/web-core/locale/resources';

import en from '#/i18n/locales/en';
import ko from '#/i18n/locales/ko';

const resources = {
  en: { translation: { ...en, ...webCoreLocaleResources.en } },
  ko: { translation: { ...ko, ...webCoreLocaleResources.ko } },
};

export type AppLocale = keyof typeof resources;
export const defaultLocale: AppLocale = 'en';

export const i18nOptions = {
  fallbackLng: defaultLocale,
  resources,
  supportedLngs: Object.keys(resources) as AppLocale[],
} satisfies CreateI18nOptions;
