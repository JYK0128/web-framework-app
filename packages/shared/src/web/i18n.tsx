import type { i18n } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

export type { i18n };

export const BrowserLanguageDetector = LanguageDetector;

const I18nContext = createContext<i18n | null>(null);

export interface I18nProviderProps {
  i18n: i18n
  children: React.ReactNode
}

export function I18nProvider({ i18n, children }: I18nProviderProps) {
  return (
    <I18nContext.Provider value={i18n}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const i18nInstance = useContext(I18nContext);
  if (!i18nInstance) {
    throw new Error('useI18n must be used within an <I18nProvider>');
  }

  const getLanguage = useCallback(
    () => i18nInstance.resolvedLanguage ?? i18nInstance.language,
    [i18nInstance],
  );
  const subscribe = useCallback((onStoreChange: () => void) => {
    const handleLanguageChange = () => onStoreChange();

    i18nInstance.on('languageChanged', handleLanguageChange);
    return () => {
      i18nInstance.off('languageChanged', handleLanguageChange);
    };
  }, [i18nInstance]);
  const language = useSyncExternalStore(subscribe, getLanguage, getLanguage);
  const t = useMemo(() => i18nInstance.getFixedT(language), [i18nInstance, language]);

  return {
    t,
    i18n: i18nInstance,
    language,
  };
}
