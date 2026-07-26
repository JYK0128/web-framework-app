import '#styles.css';

import { I18nProvider } from '@pkg/shared/web';
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import type { PropsWithChildren } from 'react';

import { Toaster } from '#.generated/shadcn/components/ui';
import { SystemDialog } from '#components/system-dialog';
import en from '#core/locales/en.json';
import ko from '#core/locales/ko.json';

export interface AppContext {
  locale: string
  cspNonce: string
  userAgent: string
  host: string
  ip: string
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

  return (
    <RootDocument locale={locale} cspNonce={cspNonce}>
      <I18nProvider options={i18nOptions}>
        <Outlet />
        <SystemDialog />
        <Toaster position="top-center" richColors closeButton />
      </I18nProvider>
    </RootDocument>
  );
}

function RootDocument({ children, locale, cspNonce }: PropsWithChildren<Partial<AppContext>>) {
  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
