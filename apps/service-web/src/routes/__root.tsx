import '#/styles/styles.css';

import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useRouter } from '@tanstack/react-router';
import type { i18n } from 'i18next';
import { Provider as JotaiProvider } from 'jotai';
import { type PropsWithChildren, useSyncExternalStore } from 'react';

import { authControllerRefreshV1, getAuthControllerMeV1QueryOptions } from '#/.generated/api/endpoints/auth/auth';
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
      if (!tokenStorage.getAccessToken()) await authControllerRefreshV1({});
      const user = await context.queryClient.fetchQuery(
        getAuthControllerMeV1QueryOptions({ query: { retry: false, staleTime: 30_000 } }),
      );
      return { user };
    }
    catch {
      tokenStorage.clear();
      return { user: null };
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
  return (
    <JotaiProvider store={tokenStore}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
