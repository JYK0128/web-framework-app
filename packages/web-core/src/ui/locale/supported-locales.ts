import type { i18n } from '@pkg/shared/common';

export type SupportedLocale = {
  code: string
  label: string
};

export function getSupportedLocales(i18nInstance: i18n): SupportedLocale[] {
  const configuredLanguages = i18nInstance.options.supportedLngs;
  const configuredCodes = Array.isArray(configuredLanguages)
    ? configuredLanguages
    : Object.keys(i18nInstance.services.resourceStore.data);
  const languageCodes = configuredCodes.filter((code): code is string => typeof code === 'string');

  return [...new Set(languageCodes)]
    .filter((code) => code !== 'cimode')
    .map((code) => ({ code, label: getNativeLanguageName(code) }));
}

function getNativeLanguageName(code: string): string {
  try {
    return new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code;
  }
  catch {
    return code;
  }
}
