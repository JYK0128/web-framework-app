import { ApplicationError } from '@pkg/shared/common';
import { GlobalLoading, RouterError, RouterNotFound, SystemDialog } from '@pkg/web-core/application';
import { useHydrationMarker } from '@pkg/web-core/hooks';
import { I18nContext, useI18nContextValue } from '@pkg/web-core/i18n';
import { ModalContainer } from '@pkg/web-core/modal';
import { PermissionProvider } from '@pkg/web-core/permission';
import { ThemeProvider, Toaster } from '@pkg/web-core/ui';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useRouter } from '@tanstack/react-router';
import type { i18n } from 'i18next';
import { Provider as JotaiProvider } from 'jotai';
import { type PropsWithChildren, useEffect } from 'react';

import { getAuthControllerMeV1QueryKey, getAuthControllerMeV1QueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { getServiceTermsControllerGetAgreementsV1QueryKey, getServiceTermsControllerGetAgreementsV1QueryOptions } from '#/.generated/api/endpoints/service-terms/service-terms';
import appStylesHref from '#/styles/styles.css?url';

export type AppRouterContext = {
  queryClient: QueryClient
  i18n: i18n
};

function AppRouterNotFound() {
  const router = useRouter();
  return <RouterNotFound onBack={() => router.history.back()} />;
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
  beforeLoad: async ({ context }) => {
    try {
      const user = await context.queryClient.fetchQuery(
        getAuthControllerMeV1QueryOptions(),
      );
      const terms = await context.queryClient.fetchQuery(getServiceTermsControllerGetAgreementsV1QueryOptions());
      return { user, terms: terms.items };
    }
    catch (error) {
      if (!(error instanceof ApplicationError) || error.status !== 401) throw error;
      context.queryClient.removeQueries({ queryKey: getAuthControllerMeV1QueryKey() });
      context.queryClient.removeQueries({ queryKey: getServiceTermsControllerGetAgreementsV1QueryKey() });
      return { user: null, terms: [] };
    }
  },
  head: () => ({
    links: [{ rel: 'stylesheet', href: appStylesHref }],
    meta: [
      { title: 'Service-Factory' },
      { name: 'description', content: 'Service-Factory service portal' },
    ],
  }),
  shellComponent: ShellDocument,
  errorComponent: RouterError,
  notFoundComponent: AppRouterNotFound,
  component: RootComponent,
});

function RootComponent() {
  const router = useRouter();
  const { user, queryClient } = Route.useRouteContext();
  useHydrationMarker();
  useEffect(() => {
    if (!user) return;
    let invalidating = false;
    const expireSession = () => {
      if (invalidating) return;
      invalidating = true;
      queryClient.clear();
      void router.invalidate();
    };
    window.addEventListener('auth-session-expired', expireSession);
    return () => window.removeEventListener('auth-session-expired', expireSession);
  }, [router, queryClient, user]);
  return (
    <JotaiProvider>
      <ThemeProvider nonce={router.options.ssr?.nonce} attribute="class" defaultTheme="system" enableSystem>
        <PermissionProvider permissions={user?.permissions}>
          <Outlet />
        </PermissionProvider>
        <SystemDialog />
        <ModalContainer />
        <GlobalLoading />
        <Toaster position="top-center" richColors />
      </ThemeProvider>
    </JotaiProvider>
  );
}

function ShellDocument({ children }: PropsWithChildren) {
  const { i18n } = useRouter().options.context;
  const i18nContextValue = useI18nContextValue(i18n);
  return (
    <html lang={i18nContextValue.language} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <HeadContent />
      </head>
      <body>
        <I18nContext.Provider value={i18nContextValue}>{children}</I18nContext.Provider>
        <Scripts />
      </body>
    </html>
  );
}
