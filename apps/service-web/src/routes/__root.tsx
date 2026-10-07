import '#/styles/styles.css';

import { ApplicationError } from '@pkg/shared/common';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useRouter } from '@tanstack/react-router';
import type { i18n } from 'i18next';
import { Provider as JotaiProvider } from 'jotai';
import { type PropsWithChildren, useSyncExternalStore } from 'react';

import { getAuthControllerMeV1QueryKey, getAuthControllerMeV1QueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { getServiceTermsControllerGetAgreementsV1QueryKey, getServiceTermsControllerGetAgreementsV1QueryOptions } from '#/.generated/api/endpoints/service-terms/service-terms';
import { Toaster } from '#/.generated/shadcn/components/ui';
import { GlobalLoading, RouterError, RouterNotFound, SystemDialog, ThemeProvider } from '#/components/app';
import { ModalContainer } from '#/components/modal';
import { I18nContext } from '#/hooks';
import { tokenStorage, tokenStore } from '#/store/token';

export type AppRouterContext = {
  queryClient: QueryClient
  i18n: i18n
};

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
      tokenStorage.clear();
      context.queryClient.removeQueries({ queryKey: getAuthControllerMeV1QueryKey() });
      context.queryClient.removeQueries({ queryKey: getServiceTermsControllerGetAgreementsV1QueryKey() });
      return { user: null, terms: [] };
    }
  },
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
  const router = useRouter();
  return (
    <JotaiProvider store={tokenStore}>
      <ThemeProvider nonce={router.options.ssr?.nonce} attribute="class" defaultTheme="system" enableSystem>
        <Outlet />
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
  const language = useSyncExternalStore(
    (notify) => {
      i18n.on('languageChanged', notify);
      return () => {
        i18n.off('languageChanged', notify);
      };
    },
    () => i18n.resolvedLanguage ?? i18n.language,
    () => i18n.resolvedLanguage ?? i18n.language,
  );
  return (
    <html lang={language} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <HeadContent />
      </head>
      <body>
        <I18nContext.Provider value={i18n}>{children}</I18nContext.Provider>
        <Scripts />
      </body>
    </html>
  );
}
