import type { i18n, TFunction } from '@pkg/shared/common';
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

export type I18nContextValue = {
  i18n: i18n
  language: string
};

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18nContextValue(i18nInstance: i18n): I18nContextValue {
  const getLanguage = useCallback(
    () => i18nInstance.resolvedLanguage ?? i18nInstance.language,
    [i18nInstance],
  );
  const getServerLanguage = useCallback(
    () => typeof document === 'undefined'
      ? getLanguage()
      : document.documentElement.lang || getLanguage(),
    [getLanguage],
  );
  const subscribe = useCallback((onStoreChange: () => void) => {
    const handleLanguageChange = () => onStoreChange();

    i18nInstance.on('languageChanged', handleLanguageChange);
    return () => {
      i18nInstance.off('languageChanged', handleLanguageChange);
    };
  }, [i18nInstance]);
  const language = useSyncExternalStore(subscribe, getLanguage, getServerLanguage);

  return useMemo(() => ({ i18n: i18nInstance, language }), [i18nInstance, language]);
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nContext.Provider');
  }

  const t: TFunction = useMemo(
    () => context.i18n.getFixedT(context.language),
    [context.i18n, context.language],
  );

  return {
    t,
    ...context,
  };
}
