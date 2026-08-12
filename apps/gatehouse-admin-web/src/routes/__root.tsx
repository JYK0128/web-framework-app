import { type i18n, z } from '@pkg/shared/common';
import { I18nProvider } from '@pkg/shared/web';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, redirect, Scripts, useRouter } from '@tanstack/react-router';
import { type PropsWithChildren } from 'react';

import { useAuthControllerGetCsrfToken } from '#/.generated/api/endpoints/auth/auth';
import { getHealthControllerGetHealthQueryOptions } from '#/.generated/api/endpoints/health/health';
import { Toaster } from '#/.generated/shadcn/components/ui';
import { RouterError, RouterNotFound, SystemDialog, SystemLoading } from '#/components/app';
import { type AuthSession, fetchAuthSession } from '#/core/auth/auth-session';
import { useVisualViewport } from '#/hooks/useVisualViewport';
import appCss from '#/styles.css?url';

export interface AppContext {
  queryClient: QueryClient
  i18n: i18n
  authSession?: AuthSession | null
}

export const Route = createRootRouteWithContext<AppContext>()({
  validateSearch: z.object({
    callback: z.preprocess(
      (value) => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : undefined,
      z.string().optional(),
    ),
  }),
  head: () => ({
    meta: [{ title: 'React Starter Kit (TanStack Start)' }],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  beforeLoad: async ({ context, location, search }) => {
    const isMaintenance = location.pathname === '/maintenance'
      || location.pathname === '/maintenance/';

    const health = await context.queryClient
      .fetchQuery(getHealthControllerGetHealthQueryOptions({
        query: { staleTime: 5_000 },
      }))
      .catch(() => null);
    const isHealthy = health?.success === true
      && health.statusCode === 200
      && health.data.status === 'ok';

    if (isMaintenance) {
      if (isHealthy) throw redirect({ href: search.callback ?? '/' });
      const authSession = await fetchAuthSession(context.queryClient);
      return { authSession };
    }

    if (!isHealthy) {
      throw redirect({
        to: '/maintenance',
        search: { callback: location.href },
      });
    }

    const authSession = await fetchAuthSession(context.queryClient);

    return {
      authSession,
    };
  },
  shellComponent: ShellDocument,
  errorComponent: RouterError,
  notFoundComponent: RouterNotFound,
  component: RootComponent,
});

function RootComponent() {
  useAuthControllerGetCsrfToken();
  useVisualViewport();

  return (
    <>
      <Outlet />
      <SystemDialog />
      <SystemLoading />
      <Toaster position="top-center" richColors />
    </>
  );
}

function ShellDocument({ children }: PropsWithChildren) {
  const { i18n } = useRouter().options.context;

  return (
    <html lang={i18n.language} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-visual" />
        <link rel="preload" href="/fonts/pretendard-100%20900.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="React Starter Kit" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" type="image/svg+xml" href="/pwa-icon.svg" />
        <link rel="apple-touch-icon" href="/pwa-icon.svg" />
        <HeadContent />
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
