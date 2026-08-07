import { createInstance, type i18n, InitOptions, type Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { createContext, useContext, useEffect, useState } from 'react';

import { env } from '#common/env';
import { setZodLanguage } from '#common/zod';

export type { i18n };

export interface WebI18nOptions {
  defaultLanguage?: string
  fallbackLanguage?: string
  resources: Resource
}

/**
 * Synchronously creates a basic i18next instance from WebI18nOptions.
 */
export function createWebI18n(options: InitOptions): i18n {
  const i18nInstance = createInstance();

  if (typeof window !== 'undefined') {
    i18nInstance.use(LanguageDetector);
  }

  void i18nInstance.init({
    fallbackLng: 'en',
    supportedLngs: options.supportedLngs
      ?? (options.resources && Object.keys(options.resources)),
    detection: {
      order: ['path', 'cookie', 'navigator', 'htmlTag'],
      caches: ['cookie'],
      lookupCookie: env.I18N_COOKIE_NAME,
      cookieMinutes: 525600,
      cookieOptions: { path: '/', sameSite: 'lax' },
    },
    ...options,
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

  const [_, setLanguage] = useState(i18nInstance.language);

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
    t: i18nInstance.t,
    i18n: i18nInstance,
  };
}
