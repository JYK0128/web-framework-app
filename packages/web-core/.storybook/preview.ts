import './styles.css';

import { createI18n } from '@pkg/shared/common';
import type { Preview } from '@storybook/react-vite';
import { ThemeProvider } from 'next-themes';
import { createElement, type CSSProperties, useEffect } from 'react';

import { localeResources } from '#/i18n/resource';
import { I18nContext, useI18nContextValue } from '#context/i18n';

const storyI18n = createI18n({
  lng: 'ko',
  fallbackLng: 'en',
  supportedLngs: ['ko', 'en'],
  resources: {
    ko: { translation: localeResources.ko },
    en: { translation: localeResources.en },
  },
  interpolation: { escapeValue: false },
});

const preview: Preview = {
  globalTypes: {
    theme: {
      name: '테마',
      description: '컴포넌트 미리보기 테마',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: '라이트' },
          { value: 'dark', title: '다크' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      name: '언어',
      description: '컴포넌트 미리보기 언어',
      defaultValue: 'ko',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'ko', title: '한국어' },
          { value: 'en', title: 'English' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === 'dark' ? 'dark' : 'light';
      const locale = context.globals.locale === 'en' ? 'en' : 'ko';
      const i18nContextValue = useI18nContextValue(storyI18n);
      const surfaceStyle: CSSProperties = {
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
      };

      useEffect(() => {
        void storyI18n.changeLanguage(locale);
        document.documentElement.lang = locale;
      }, [locale]);

      return createElement(
        ThemeProvider,
        { attribute: 'class', forcedTheme: theme, enableSystem: false },
        createElement(
          I18nContext.Provider,
          { value: i18nContextValue },
          createElement('div', { style: surfaceStyle }, createElement(Story)),
        ),
      );
    },
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'padded',
  },
};

export default preview;
