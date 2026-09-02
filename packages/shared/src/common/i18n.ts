import { createInstance, type i18n, type InitOptions, type Module, type Newable, type NewableModule } from 'i18next';

import { setZodTranslator } from './zod';

export type I18nModule = Module | NewableModule<Module> | Newable<Module>;

export interface CreateI18nOptions extends InitOptions {
  modules?: readonly I18nModule[]
}

/**
 * Synchronously creates an initialized i18next instance for bundled resources.
 * Runtime-specific detectors are supplied through `modules`.
 */
export function createI18n(options: CreateI18nOptions): i18n {
  const { modules = [], ...initOptions } = options;
  const i18nInstance = createInstance();

  for (const module of modules) {
    i18nInstance.use(module);
  }

  // ✨ i18next 언어 변경/초기화 시 Zod에 번역 함수(t)를 자동으로 주입
  i18nInstance.on('languageChanged', () => {
    setZodTranslator((key, opts) => i18nInstance.t(key, opts as Record<string, unknown>));
  });

  void i18nInstance.init({
    fallbackLng: 'en',
    supportedLngs: initOptions.supportedLngs
      ?? (initOptions.resources ? Object.keys(initOptions.resources) : undefined),
    ...initOptions,
    initAsync: false,
  });

  return i18nInstance;
}

export type { i18n, InitOptions, TFunction } from 'i18next';
