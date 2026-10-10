import type { i18n, TFunction } from '@pkg/shared/common';
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

export const I18nContext = createContext<i18n | null>(null);

export function useI18n() {
  const i18nInstance = useContext(I18nContext);
  if (!i18nInstance) {
    throw new Error('useI18n must be used within an I18nContext.Provider');
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
  const t: TFunction = useMemo(() => i18nInstance.getFixedT(language), [i18nInstance, language]);

  return {
    t,
    i18n: i18nInstance,
    language,
  };
}
