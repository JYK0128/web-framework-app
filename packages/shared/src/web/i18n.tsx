import { createInstance, type i18n, type Resource } from 'i18next';
import { createContext, useContext, useEffect, useState } from 'react';

import { setZodLanguage } from '#common/zod';

export type { i18n };

export interface WebI18nOptions {
  resources: Resource
}

/**
 * Synchronously creates a basic i18next instance from WebI18nOptions.
 */
export function createWebI18n(options: WebI18nOptions, locale: string = 'en'): i18n {
  const i18nInstance = createInstance();

  void i18nInstance.init({
    lng: locale,
    fallbackLng: 'en',
    resources: options.resources,
  });

  setZodLanguage(i18nInstance.language);
  return i18nInstance;
}

const I18nContext = createContext<i18n | null>(null);

export interface I18nProviderProps {
  i18n: i18n
  children: React.ReactNode
}

/**
 * Universal React Context Provider for i18n.
 * Accepts a pre-created i18n instance.
 */
export function I18nProvider({ i18n, children }: I18nProviderProps) {
  return (
    <I18nContext.Provider value={i18n}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * React Hook for accessing reactive i18n state and translation functions.
 */
export function useI18n() {
  const i18nInstance = useContext(I18nContext);
  if (!i18nInstance) {
    throw new Error('useI18n must be used within an <I18nProvider>');
  }

  const [language, setLanguage] = useState(i18nInstance.language);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLanguage(lng);
    };

    i18nInstance.on('languageChanged', handleLanguageChange);
    return () => {
      i18nInstance.off('languageChanged', handleLanguageChange);
    };
  }, [i18nInstance]);

  return {
    t: i18nInstance.t.bind(i18nInstance),
    i18n: i18nInstance,
    language,
  };
}
