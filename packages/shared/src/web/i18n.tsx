import { createInstance, type i18n, type Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { createContext, useContext, useEffect, useState } from 'react';

import { I18N_COOKIE_NAME } from '#common/constants';
import { setZodLanguage } from '#common/zod';

export type { i18n };

export interface WebI18nOptions {
  resources: Resource
}

/**
 * Asynchronously creates a browser-optimized i18next instance.
 */
export async function createWebI18n(options: WebI18nOptions): Promise<i18n> {
  const instance = createInstance();

  await instance.use(LanguageDetector).init({
    detection: {
      order: ['path', 'cookie', 'navigator'],
      lookupFromPathIndex: 0,
      lookupCookie: I18N_COOKIE_NAME,
      caches: ['cookie'],
    },
    fallbackLng: 'en',
    resources: options.resources,
  });

  setZodLanguage(instance.language);
  instance.on('languageChanged', (lng) => {
    setZodLanguage(lng);
  });

  return instance;
}

const I18nContext = createContext<i18n | null>(null);

export interface I18nProviderProps {
  i18n?: i18n
  options?: WebI18nOptions
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Universal React Context Provider for i18n.
 * Supports passing an existing i18n instance or WebI18nOptions for automatic async initialization.
 */
export function I18nProvider({ i18n, options, fallback = null, children }: I18nProviderProps) {
  const [instance, setInstance] = useState<i18n | null>(i18n ?? null);

  useEffect(() => {
    if (i18n) {
      setInstance(i18n);
      return;
    }

    if (!instance && options) {
      let isMounted = true;
      void createWebI18n(options).then((res) => {
        if (isMounted) {
          setInstance(res);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [i18n, instance, options]);

  if (!instance) {
    return <>{fallback}</>;
  }

  return (
    <I18nContext.Provider value={instance}>
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
    language,
    changeLanguage: (lng: string) => i18nInstance.changeLanguage(lng),
    i18n: i18nInstance,
  };
}
