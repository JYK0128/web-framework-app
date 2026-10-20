import { ApplicationError } from '@pkg/shared/common';
import { GlobalLoading, RouterError, RouterNotFound, SystemDialog } from '@pkg/web-core/application';
import { useHydrationMarker } from '@pkg/web-core/hooks';
import { I18nContext, useI18nContextValue } from '@pkg/web-core/i18n';
import { ModalContainer } from '@pkg/web-core/modal';
import { PermissionProvider } from '@pkg/web-core/permission';
import { ThemeProvider, Toaster } from '@pkg/web-core/ui';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useLocation, useRouter } from '@tanstack/react-router';
import type { i18n } from 'i18next';
import { Provider as JotaiProvider } from 'jotai';
import type { PropsWithChildren } from 'react';

import { getAuthControllerMeV1QueryKey, getAuthControllerMeV1QueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { getServiceTermsControllerGetAgreementsV1QueryKey, getServiceTermsControllerGetAgreementsV1QueryOptions } from '#/.generated/api/endpoints/service-terms/service-terms';
import { getSystemConfigsControllerGetConfigsV1QueryOptions } from '#/.generated/api/endpoints/system-configs/system-configs';
import { useSessionExpiration } from '#/hooks/use-session-expiration';
import { i18nOptions } from '#/i18n/config';
import appStylesHref from '#/styles/styles.css?url';

import { Maintenance } from './-components/maintenance';

export type AppRouterContext = {
  queryClient: QueryClient
  i18n: i18n
};

function AppRouterNotFound() {
  const router = useRouter();
  return <RouterNotFound onBack={() => router.history.back()} />;
}

function isLandingPath(pathname: string) {
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  return normalizedPath === '/'
    || i18nOptions.supportedLngs.some((locale) => normalizedPath === `/${locale}`);
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
  shouldReload: true,
  beforeLoad: async ({ context, location }) => {
    // The public landing pages are prerendered at build time and do not need
    // session data. Avoid making the static build depend on the live API.
    if (isLandingPath(location.pathname)) {
      return { user: null, terms: [], config: null };
    }

    const [config, user] = await Promise.all([
      context.queryClient.fetchQuery(
        getSystemConfigsControllerGetConfigsV1QueryOptions({ query: { staleTime: 60_000 } }),
      ),
      context.queryClient.fetchQuery(
        getAuthControllerMeV1QueryOptions({ query: { staleTime: 60_000 } }),
      ).catch((error: unknown) => {
        if (!(error instanceof ApplicationError) || error.status !== 401) throw error;
        return null;
      }),
    ]);
    if (!user) {
      context.queryClient.removeQueries({ queryKey: getAuthControllerMeV1QueryKey() });
      context.queryClient.removeQueries({ queryKey: getServiceTermsControllerGetAgreementsV1QueryKey() });
      return { user: null, terms: [], config };
    }

    try {
      const terms = await context.queryClient.fetchQuery(
        getServiceTermsControllerGetAgreementsV1QueryOptions({ query: { staleTime: 60_000 } }),
      );
      return { user, terms: terms.items, config };
    }
    catch (error) {
      if (!(error instanceof ApplicationError) || error.status !== 401) throw error;
      context.queryClient.removeQueries({ queryKey: getAuthControllerMeV1QueryKey() });
      context.queryClient.removeQueries({ queryKey: getServiceTermsControllerGetAgreementsV1QueryKey() });
      return { user: null, terms: [], config };
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
  const location = useLocation();
  const { user } = Route.useRouteContext();
  const isLandingPage = isLandingPath(location.pathname);
  useHydrationMarker();
  useSessionExpiration(Boolean(user));
  return (
    <JotaiProvider>
      <ThemeProvider nonce={router.options.ssr?.nonce} attribute="class" defaultTheme="system" enableSystem>
        <PermissionProvider permissions={user?.permissions}>
          {isLandingPage ? <Outlet /> : <Maintenance><Outlet /></Maintenance>}
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
