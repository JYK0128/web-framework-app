import type { CreateI18nOptions } from '@pkg/shared/common';
import { localeResources } from '@pkg/web-core/i18n/resource';

import en from '#/i18n/resource/en';
import ko from '#/i18n/resource/ko';

const resources = {
  en: { translation: { ...localeResources.en, ...en, app: { ...localeResources.en.app, ...en.app } } },
  ko: { translation: { ...localeResources.ko, ...ko, app: { ...localeResources.ko.app, ...ko.app } } },
};

export type AppLocale = keyof typeof resources;
export const defaultLocale: AppLocale = 'en';

export const i18nOptions = {
  fallbackLng: defaultLocale,
  resources,
  supportedLngs: Object.keys(resources) as AppLocale[],
} satisfies CreateI18nOptions;
