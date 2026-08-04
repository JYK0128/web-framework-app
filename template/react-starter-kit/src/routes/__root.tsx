import '#/styles.css';

import { I18nProvider } from '@pkg/shared/web';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { type PropsWithChildren, useEffect } from 'react';

import { Toaster } from '#/.generated/shadcn/components/ui';
import { RouterError, RouterNotFound, SystemDialog, SystemLoading } from '#/components/app';
import en from '#/core/locales/en.json';
import ko from '#/core/locales/ko.json';
import { useVisualViewport } from '#/hooks/useVisualViewport';
import { initEnvironment } from '#/lib/browser';

export interface AppContext {
  queryClient: QueryClient
  locale: string
  cspNonce: string
  userAgent: string | null
  host: string | null
  ip: string | null
}

const i18nOptions = {
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
};

export const Route = createRootRouteWithContext<AppContext>()({
  head: () => ({
    meta: [{ title: 'React Starter Kit (TanStack Start)' }],
  }),
  errorComponent: RouterError,
  notFoundComponent: RouterNotFound,
  component: RootComponent,
});

function RootComponent() {
  const { locale, cspNonce } = Route.useRouteContext();
  useVisualViewport();

  useEffect(() => {
    initEnvironment();
  }, []);

  return (
    <RootDocument locale={locale} cspNonce={cspNonce}>
      <I18nProvider options={i18nOptions}>
        <Outlet />
        <SystemDialog />
        <SystemLoading />
        <Toaster position="top-center" richColors />
      </I18nProvider>
    </RootDocument>
  );
}

function RootDocument({ children, locale, cspNonce }: PropsWithChildren<Partial<AppContext>>) {
  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-visual" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="React Starter Kit" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" type="image/svg+xml" href="/pwa-icon.svg" />
        <link rel="apple-touch-icon" href="/pwa-icon.svg" />
        <meta property="csp-nonce" nonce={cspNonce} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
