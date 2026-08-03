import '#/styles.css';

import { I18nProvider } from '@pkg/shared/web';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { type PropsWithChildren, useEffect } from 'react';

import { Toaster } from '#/.generated/shadcn/components/ui';
import { SystemDialog } from '#/components/system-dialog';
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
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
