import '#/styles/styles.css';

import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useLocation, useNavigate } from '@tanstack/react-router';
import { Provider as JotaiProvider } from 'jotai';
import { type PropsWithChildren, useEffect, useState } from 'react';

import { authControllerRefreshV1, getAuthControllerMeV1QueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { getSystemConfigsControllerListConfigsV1QueryOptions } from '#/.generated/api/endpoints/system-configs/system-configs';
import { Toaster } from '#/.generated/shadcn/components/ui';
import { GlobalLoading, LoadingRouter, RouterError, RouterNotFound, SystemDialog, ThemeProvider } from '#/components/app';
import { MaintenanceNotice } from '#/components/maintenance-notice';
import { ModalContainer } from '#/components/modal';
import { AUTH_QUERY_STALE_TIME_MS, SYSTEM_CONFIG_REFRESH_INTERVAL_MS } from '#/configs/app.config';
import { authUserAtom, tokenStorage, tokenStore } from '#/store/token';

export type AppRouterContext = {
  queryClient: QueryClient
};

export const Route = createRootRouteWithContext<AppRouterContext>()({
  head: () => ({
    meta: [
      { title: 'Service Web' },
      { name: 'description', content: 'Service Web application' },
    ],
  }),
  shellComponent: ShellDocument,
  errorComponent: RouterError,
  notFoundComponent: RouterNotFound,
  component: RootComponent,
});

function RootComponent() {
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.prefetchQuery(getSystemConfigsControllerListConfigsV1QueryOptions({
      query: { retry: false, staleTime: SYSTEM_CONFIG_REFRESH_INTERVAL_MS },
    }));
  }, [queryClient]);

  return (
    <JotaiProvider store={tokenStore}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <MaintenanceNotice />
        <AuthBootstrap>
          <Outlet />
        </AuthBootstrap>
        <SystemDialog />
        <ModalContainer />
        <GlobalLoading />
        <Toaster position="top-center" richColors />
      </ThemeProvider>
    </JotaiProvider>
  );
}

function AuthBootstrap({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const isProtectedPath = location.pathname.startsWith('/qna') || location.pathname.startsWith('/support') || location.pathname === '/identity-verification' || location.pathname === '/settings/security';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (location.pathname === '/oauth/callback') return;

    // The loading gate must reopen whenever the protected location changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsChecking(true);
    const restoreSession = async () => {
      if (!tokenStorage.getAccessToken()) await authControllerRefreshV1({});
      const response = await queryClient.fetchQuery(
        getAuthControllerMeV1QueryOptions({ query: { retry: false, staleTime: AUTH_QUERY_STALE_TIME_MS } }),
      );
      tokenStore.set(authUserAtom, response.data);
      if (response.data.identityVerificationRequired && !response.data.identityVerified && location.pathname !== '/identity-verification') {
        await navigate({ to: '/identity-verification', search: { callback: `${location.pathname}${location.searchStr}${location.hash}` }, replace: true });
      }
      else if (response.data.twoFactorRequired && !response.data.twoFactorEnabled && location.pathname !== '/settings/security') {
        await navigate({ to: '/settings/security', replace: true });
      }
      else if (response.data.passwordExpired && location.pathname !== '/forgot-password') {
        await navigate({ to: '/forgot-password', replace: true });
      }
      else if ((!response.data.identityVerificationRequired || response.data.identityVerified) && location.pathname === '/identity-verification') {
        await navigate({ to: '/qna', replace: true });
      }
    };

    void restoreSession()
      .catch(async () => {
        tokenStore.set(authUserAtom, null);
        if (isProtectedPath) {
          await navigate({
            to: '/login',
            search: { callback: `${location.pathname}${location.searchStr}${location.hash}` },
            replace: true,
          });
        }
      })
      .finally(() => setIsChecking(false));
  }, [isProtectedPath, location.hash, location.pathname, location.searchStr, navigate, queryClient]);

  if (isProtectedPath && isChecking) return <LoadingRouter />;
  return children;
}

function ShellDocument({ children }: PropsWithChildren) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
