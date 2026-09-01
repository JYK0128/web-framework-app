import { createInstance, type i18n } from 'i18next';
import { z } from 'zod';
import en from 'zod/v4/locales/en.cjs';
import ko from 'zod/v4/locales/ko.cjs';

// Create central i18n instance for shared common validation
const zI18n: i18n = createInstance();

void zI18n.init({
  lng: 'en',
  fallbackLng: 'en',
});

// Built-in Zod v4 locale maps
const zodLocales: Record<string, ReturnType<typeof ko>> = {
  ko: ko(),
  en: en(),
};

/**
 * Configure Zod v4 to resolve validation error messages dynamically
 * based on the active i18n language (Path, Cookie, Navigator, etc.).
 * Default fallback language is 'en'.
 */
z.config({
  customError: (issue) => {
    const activeLang = zI18n.language || 'en';
    const localeConfig = zodLocales[activeLang] || zodLocales.en;
    return localeConfig.localeError(issue);
  },
});

/**
 * Explicitly set or change the global Zod validation error message language.
 * Useful for Batch jobs, CLI scripts, or standalone background workers.
 *
 * @example
 * setZodLanguage('ko');
 */
export function setZodLanguage(lang: string): void {
  void zI18n.changeLanguage(lang);
}

export { z };
