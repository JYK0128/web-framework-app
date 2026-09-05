import '#/styles.css';

import { when, z } from '@pkg/shared/common';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, redirect, Scripts, useRouter } from '@tanstack/react-router';
import type { i18n } from 'i18next';
import { type PropsWithChildren } from 'react';

import { Toaster } from '#/.generated/shadcn/components/ui';
import { CookieConsentBanner, GlobalLoading, RouterError, RouterNotFound, SystemDialog, ThemeProvider } from '#/components/app';
import { OverlayContainer } from '#/components/dialog';
import { useAnalytics, useConsentSync, useGlobalSecurity, useUnhandledError, useVisualViewport } from '#/hooks';
import { I18nContext } from '#/hooks/useI18n';

export interface AppContext {
  queryClient: QueryClient
  i18n: i18n
}

export const Route = createRootRouteWithContext<AppContext>()({
  validateSearch: z.object({
    callback: z.preprocess(
      (value) => when((value): value is string => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//'), (value) => value)(value),
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
    const { getSystemConfigControllerGetSystemConfigQueryOptions } = await import('#/.generated/api/endpoints/system-config/system-config');
    const { getAuthControllerUserProfileQueryOptions } = await import('#/.generated/api/endpoints/auth/auth');

    const isMaintenance = location.pathname === '/maintenance'
      || location.pathname === '/maintenance/';
    const isServiceUnavailable = location.pathname === '/service-unavailable'
      || location.pathname === '/service-unavailable/';
    const isLoginPage = location.pathname.startsWith('/login');

    const [health, systemConfig] = await Promise.all([
      context.queryClient
        .ensureQueryData(getHealthControllerGetHealthQueryOptions({
          query: { staleTime: 30_000, gcTime: 30_000 },
        }))
        .catch(() => null),
      context.queryClient
        .ensureQueryData(getSystemConfigControllerGetSystemConfigQueryOptions({
          query: { staleTime: 10_000, gcTime: 30_000 },
        }))
        .catch(() => null),
    ]);

    // 1. 돌발 시스템 장애 (백엔드 헬스체크 실패) 판정 -> /service-unavailable
    const isHealthy = health?.status === 'ok';
    if (!isHealthy) {
      if (!isServiceUnavailable) {
        throw redirect({
          to: '/service-unavailable',
          search: { callback: location.href },
        });
      }
      return;
    }

    if (isServiceUnavailable) {
      throw redirect({ href: search.callback ?? '/' });
    }

    // 2. 계획된 시스템 점검 모드 판정 -> /maintenance
    const isUnderMaintenance = Boolean(systemConfig?.maintenanceMode);
    if (isUnderMaintenance) {
      const user = await context.queryClient
        .ensureQueryData(getAuthControllerUserProfileQueryOptions({
          query: { staleTime: 30_000, gcTime: 60_000 },
        }))
        .catch(() => null);

      const hasAdminAccess = Boolean(user?.permissions && user.permissions['system:manage']);

      // 관리자는 점검 중에도 전체 접근 허용, 일반 사용자는 로그인 페이지만 예외 허용
      if (hasAdminAccess || isLoginPage) {
        return;
      }

      if (!isMaintenance) {
        throw redirect({
          to: '/maintenance',
          search: { callback: location.href },
        });
      }
      return;
    }

    if (isMaintenance) {
      throw redirect({ href: search.callback ?? '/' });
    }
  },
  shellComponent: ShellDocument,
  errorComponent: RouterError,
  notFoundComponent: RouterNotFound,
  component: RootComponent,
});

function RootComponent() {
  const nonce = useRouter().options.ssr?.nonce;
  const unhandledSystemError = useUnhandledError();

  useVisualViewport();
  useAnalytics(nonce);
  useConsentSync(nonce);
  useGlobalSecurity();

  if (unhandledSystemError) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem nonce={nonce}>
        <RouterError error={unhandledSystemError} />
        <Toaster position="top-center" richColors />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem nonce={nonce}>
      <Outlet />
      <CookieConsentBanner nonce={nonce} />
      <SystemDialog />
      <OverlayContainer />
      <GlobalLoading />
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  );
}

function ShellDocument({ children }: PropsWithChildren) {
  const router = useRouter();
  const { i18n } = router.options.context;

  return (
    <html lang={i18n.language} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-visual" />
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
        <I18nContext.Provider value={i18n}>
          {children}
        </I18nContext.Provider>
        <Scripts />
      </body>
    </html>
  );
}
