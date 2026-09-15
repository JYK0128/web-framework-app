import '#/styles.css';

import { ApplicationError, when, z } from '@pkg/shared/common';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, redirect, Scripts, useMatch, useRouter } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import type { i18n } from 'i18next';
import { type PropsWithChildren } from 'react';

import { Toaster } from '#/.generated/shadcn/components/ui';
import { CookieConsentBanner, GlobalLoading, RouterError, RouterNotFound, SystemDialog, ThemeProvider } from '#/components/app';
import { OverlayContainer } from '#/components/dialog';
import { QUERY_GC_TIME_60S, QUERY_STALE_TIME_30S, QUERY_STALE_TIME_60S } from '#/configs/query.config';
import { useAnalytics, useGlobalSecurity, useUnhandledError, useVisualViewport } from '#/hooks';
import { I18nContext } from '#/hooks/useI18n';

export interface AppContext {
  queryClient: QueryClient
  i18n: i18n
}

type RestrictionErrorInfo = {
  isRestricted: boolean
  code?: string
  status?: number
  message: string
};

function extractErrorInfo(error: unknown): RestrictionErrorInfo {
  if (!error) return { isRestricted: false, message: '' };

  let status: number | undefined;
  let code: string | undefined;
  let message = '';

  if (error instanceof ApplicationError) {
    status = error.status;
    code = error.code;
    message = error.message;
  }
  else if (isAxiosError(error)) {
    status = error.response?.status;
    const data = error.response?.data as { errorCode?: string, message?: string } | undefined;
    code = data?.errorCode;
    message = data?.message || error.message;
  }
  else if (error instanceof Error) {
    message = error.message;
  }

  const isRateLimited = status === 429
    || code === 'TOO_MANY_REQUESTS'
    || message.includes('Too Many Requests')
    || message.includes('ThrottlerException');

  const isSecurityRestricted = status === 403
    || status === 451
    || code === 'USER_BANNED'
    || code === 'ACCOUNT_LOCKED'
    || code === 'BFF_ACCESS_REQUIRED'
    || code === 'FORBIDDEN';

  return {
    isRestricted: isRateLimited || isSecurityRestricted,
    code,
    status,
    message,
  };
}

function handleSystemStatus({
  errorInfo,
  health,
  location,
  search,
  systemConfig,
}: {
  errorInfo: RestrictionErrorInfo
  health: { status?: string } | null
  location: { pathname: string, href: string }
  search: { callback?: string }
  systemConfig: unknown
}) {
  const isAccessRestricted = location.pathname === '/access-restricted'
    || location.pathname === '/access-restricted/';
  const isServiceUnavailable = location.pathname === '/service-unavailable'
    || location.pathname === '/service-unavailable/';

  // 1. 접근 제한 및 요청 속도 제한 (429, 403 계정 정지/잠금 등) 판정 -> /access-restricted
  if (errorInfo.isRestricted) {
    if (!isAccessRestricted) {
      throw redirect({
        to: '/access-restricted',
        search: {
          callback: location.href,
          code: errorInfo.code,
          status: errorInfo.status ? String(errorInfo.status) : undefined,
          message: errorInfo.message || undefined,
        },
      });
    }
    return;
  }

  if (isAccessRestricted) {
    if (health?.status === 'ok' && Boolean(systemConfig)) {
      throw redirect({ href: search.callback ?? '/' });
    }
    return;
  }

  // 2. 돌발 시스템 장애 (백엔드 헬스체크 실패 또는 필수 시스템 설정 로드 실패) 판정 -> /service-unavailable
  const isHealthy = health?.status === 'ok';
  const isConfigAvailable = Boolean(systemConfig);
  if (!isHealthy || !isConfigAvailable) {
    if (!isServiceUnavailable) {
      throw redirect({
        to: '/service-unavailable',
        search: {
          callback: location.href,
          message: errorInfo.message || undefined,
        },
      });
    }
    return;
  }

  if (isServiceUnavailable) {
    throw redirect({ href: search.callback ?? '/' });
  }
}

async function checkMaintenanceMode({
  location,
  queryClient,
  search,
  systemConfig,
}: {
  location: { pathname: string, href: string }
  queryClient: QueryClient
  search: { callback?: string }
  systemConfig: { maintenanceMode?: boolean } | null
}) {
  const isMaintenance = location.pathname === '/maintenance'
    || location.pathname === '/maintenance/';
  const isUnderMaintenance = Boolean(systemConfig?.maintenanceMode);

  if (!isUnderMaintenance) {
    if (isMaintenance) {
      throw redirect({ href: search.callback ?? '/' });
    }
    return;
  }

  const { getAuthControllerMeQueryOptions } = await import('#/.generated/api/endpoints/auth/auth');
  const user = await queryClient
    .ensureQueryData(getAuthControllerMeQueryOptions({
      query: { staleTime: QUERY_STALE_TIME_60S, gcTime: QUERY_GC_TIME_60S },
    }))
    .catch(() => null);

  const hasAdminAccess = Boolean(user?.permissions && user.permissions['system:manage']);
  const isLoginPage = location.pathname.startsWith('/login');

  if (hasAdminAccess || isLoginPage) {
    return;
  }

  if (!isMaintenance) {
    throw redirect({
      to: '/maintenance',
      search: { callback: location.href },
    });
  }
}

export const Route = createRootRouteWithContext<AppContext>()({
  validateSearch: z.looseObject({
    callback: z.preprocess(
      (value) => when((value): value is string => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//'), (value) => value)(value),
      z.string().optional(),
    ),
    code: z.string().optional(),
    status: z.string().optional(),
    message: z.string().optional(),
  }),
  head: () => ({
    meta: [{ title: 'Service Factory (TanStack Start)' }],
  }),
  beforeLoad: async ({ context, location, search }) => {
    const isLandingPage = location.pathname === '/'
      || /^\/(?:ko|en)\/?$/.test(location.pathname);
    if (isLandingPage) {
      return {
        systemConfig: null,
        health: null,
      };
    }

    const { getHealthControllerGetHealthQueryOptions } = await import('#/.generated/api/endpoints/health/health');
    const { getSystemConfigControllerGetSystemConfigQueryOptions } = await import('#/.generated/api/endpoints/system-config/system-config');

    let healthError: unknown = null;
    let configError: unknown = null;

    const [health, systemConfig] = await Promise.all([
      context.queryClient
        .ensureQueryData(getHealthControllerGetHealthQueryOptions({
          query: { staleTime: QUERY_STALE_TIME_30S, gcTime: QUERY_GC_TIME_60S },
        }))
        .catch((err) => {
          healthError = err;
          return null;
        }),
      context.queryClient
        .ensureQueryData(getSystemConfigControllerGetSystemConfigQueryOptions({
          query: { staleTime: QUERY_STALE_TIME_30S, gcTime: QUERY_GC_TIME_60S },
        }))
        .catch((err) => {
          configError = err;
          return null;
        }),
    ]);

    const primaryError = healthError || configError;
    const errorInfo = extractErrorInfo(primaryError);

    handleSystemStatus({
      health,
      systemConfig,
      errorInfo,
      location,
      search,
    });

    await checkMaintenanceMode({
      systemConfig,
      queryClient: context.queryClient,
      location,
      search,
    });

    return {
      systemConfig,
      health,
    };
  },
  shellComponent: ShellDocument,
  errorComponent: RouterError,
  notFoundComponent: RouterNotFound,
  component: RootComponent,
});

function RootComponent() {
  const nonce = useRouter().options.ssr?.nonce;
  const protectedMatch = useMatch({ from: '/_protected', shouldThrow: false });
  const unhandledSystemError = useUnhandledError();

  useVisualViewport();
  useAnalytics(nonce);
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
      <CookieConsentBanner nonce={nonce} user={protectedMatch?.context.user} />
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
