import '#/styles/styles.css';

import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useLocation, useNavigate } from '@tanstack/react-router';
import { Provider as JotaiProvider } from 'jotai';
import { type PropsWithChildren, useEffect, useState } from 'react';

import { authControllerRefreshV1, getAuthControllerMeV1QueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { Toaster } from '#/.generated/shadcn/components/ui';
import { GlobalLoading, LoadingRouter, RouterError, RouterNotFound, SystemDialog, ThemeProvider } from '#/components/app';
import { ModalContainer } from '#/components/modal';
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
  return (
    <JotaiProvider store={tokenStore}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
  const isProtectedPath = location.pathname.startsWith('/qna') || location.pathname.startsWith('/support');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // The loading gate must reopen whenever the protected location changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsChecking(true);
    const restoreSession = async () => {
      if (!tokenStorage.getAccessToken()) await authControllerRefreshV1({});
      const response = await queryClient.fetchQuery(
        getAuthControllerMeV1QueryOptions({ query: { retry: false, staleTime: 60_000 } }),
      );
      tokenStore.set(authUserAtom, response.data);
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
