import '#/styles.css';

import { type i18n, z } from '@pkg/shared/common';
import { I18nProvider } from '@pkg/shared/web';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, redirect, Scripts, useRouter } from '@tanstack/react-router';
import { type PropsWithChildren } from 'react';

import { Toaster } from '#/.generated/shadcn/components/ui';
import { CookieConsentBanner, RouterError, RouterNotFound, SystemDialog, SystemLoading, ThemeProvider } from '#/components/app';
import { useAnalytics } from '#/hooks/useAnalytics';
import { useConsentSync } from '#/hooks/useConsentSync';
import { useVisualViewport } from '#/hooks/useVisualViewport';

export interface AppContext {
  queryClient: QueryClient
  i18n: i18n
}

export const Route = createRootRouteWithContext<AppContext>()({
  validateSearch: z.object({
    callback: z.preprocess(
      (value) => (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : undefined),
      z.string().optional(),
    ),
  }),
  head: () => ({
    meta: [{ title: 'Service Factory (TanStack Start)' }],
  }),
  beforeLoad: async ({ context, location, search }) => {
    const isLandingPage = location.pathname === '/'
      || /^\/(?:ko|en)\/?$/.test(location.pathname);
    if (isLandingPage) return;

    const { getHealthControllerGetHealthQueryOptions } = await import('#/.generated/api/endpoints/health/health');

    const isMaintenance = location.pathname === '/maintenance'
      || location.pathname === '/maintenance/';

    const health = await context.queryClient
      .ensureQueryData(getHealthControllerGetHealthQueryOptions({
        query: { staleTime: 30_000, gcTime: 30_000 },
      }))
      .catch(() => null);
    const isHealthy = health?.status === 'ok';

    if (isMaintenance) {
      if (isHealthy) throw redirect({ href: search.callback ?? '/' });
      return;
    }

    if (!isHealthy) {
      throw redirect({
        to: '/maintenance',
        search: { callback: location.href },
      });
    }
  },
  shellComponent: ShellDocument,
  errorComponent: RouterError,
  notFoundComponent: RouterNotFound,
  component: RootComponent,
});

function RootComponent() {
  const nonce = useRouter().options.ssr?.nonce;

  useVisualViewport();
  useAnalytics(nonce);
  useConsentSync(nonce);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem nonce={nonce}>
      <Outlet />
      <CookieConsentBanner nonce={nonce} />
      <SystemDialog />
      <SystemLoading />
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  );
}

function ShellDocument({ children }: PropsWithChildren) {
  const router = useRouter();
  const { i18n } = router.options.context;
  const nonce = router.options.ssr?.nonce;

  return (
    <html lang={i18n.language} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-visual" />
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: 'globalThis.__zod_globalConfig = { ...(globalThis.__zod_globalConfig || {}), jitless: true };',
          }}
        />
        <HeadContent />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Service Factory" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" type="image/svg+xml" href="/pwa-icon.svg" />
        <link rel="apple-touch-icon" href="/pwa-icon.svg" />
      </head>
      <body>
        <I18nProvider i18n={i18n}>
          {children}
        </I18nProvider>
        <Scripts />
      </body>
    </html>
  );
}
