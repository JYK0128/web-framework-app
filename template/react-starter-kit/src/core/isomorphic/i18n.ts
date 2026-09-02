import { createI18n, type CreateI18nOptions } from '@pkg/shared/common';
import { createIsomorphicFn, getGlobalStartContext } from '@tanstack/react-start';
import type { i18n } from 'i18next';
import BrowserLanguageDetector from 'i18next-browser-languagedetector';
import { LanguageDetector as HttpLanguageDetector } from 'i18next-http-middleware';

import en from '#/core/locales/en';
import ko from '#/core/locales/ko';

export const locales = [
  { code: 'ko', label: '한국어', shortLabel: 'KO' },
  { code: 'en', label: 'English', shortLabel: 'EN' },
] as const;

export type AppLocale = (typeof locales)[number]['code'];
export const defaultLocale: AppLocale = 'en';

export const i18nOptions = {
  fallbackLng: defaultLocale,
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
  supportedLngs: locales.map(({ code }) => code),
} satisfies CreateI18nOptions;

type RequestLanguageDetector = {
  detect(request: unknown, response?: unknown): string | string[] | undefined
};

// SSR 서버 베이스 인스턴스 (요청별 복제의 원천)
const serverBaseInstance = createI18n({
  ...i18nOptions,
  modules: [HttpLanguageDetector],
  detection: {
    order: ['path', 'cookie', 'header'],
    convertDetectedLanguage: (language) => language.split('-')[0],
  },
});

// CSR 브라우저 전역 인스턴스
export const clientI18n = createI18n({
  ...i18nOptions,
  modules: [BrowserLanguageDetector],
  detection: {
    order: ['path', 'cookie', 'htmlTag', 'navigator'],
    caches: ['cookie'],
    cookieMinutes: 525600,
    cookieOptions: { path: '/', sameSite: 'lax' },
    convertDetectedLanguage: (language) => language.split('-')[0],
  },
});

/**
 * SSR 서버: 요청(Request)마다 헤더/쿠키/경로를 분석하여 격리된 i18n 인스턴스 반환
 */
export async function getServerI18n(request: Request): Promise<i18n> {
  const url = new URL(request.url);
  const detector = serverBaseInstance.services.languageDetector as RequestLanguageDetector;

  const detected = detector?.detect({
    url: `${url.pathname}${url.search}`,
    headers: Object.fromEntries(request.headers.entries()),
  }, undefined);
  const language = (Array.isArray(detected) ? detected[0] : detected);

  const reqI18n = serverBaseInstance.cloneInstance({ initAsync: false });
  if (language) {
    await reqI18n.changeLanguage(language);
  }

  return reqI18n;
}

/**
 * 동형(Isomorphic) 인스턴스 Getter:
 * - 서버(SSR): 미들웨어가 컨텍스트에 주입한 요청별 i18n 인스턴스 반환
 * - 클라이언트(CSR): 브라우저 싱글톤 i18n 인스턴스 반환
 */
export const getI18n = createIsomorphicFn()
  .server(() => {
    const i18n = getGlobalStartContext()?.i18n;
    if (!i18n) throw new Error('i18n middleware did not provide a request instance');
    return i18n;
  })
  .client(() => clientI18n);
