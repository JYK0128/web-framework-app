import '#/styles/styles.css';

import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, useRouter } from '@tanstack/react-router';
import type { i18n } from 'i18next';
import { Provider as JotaiProvider } from 'jotai';
import type { PropsWithChildren } from 'react';

import { Toaster } from '#/.generated/shadcn/components/ui';
import { AppBootstrap, GlobalLoading, RouterError, RouterNotFound, SystemDialog, ThemeProvider } from '#/components/app';
import { ModalContainer } from '#/components/modal';
import { I18nContext } from '#/hooks';
import { tokenStore } from '#/store/token';

export type AppRouterContext = {
  queryClient: QueryClient
  i18n: i18n
};

export const Route = createRootRouteWithContext<AppRouterContext>()({
  head: () => ({
    meta: [
      { title: '운영자 웹' },
      { name: 'description', content: '운영자 웹 application' },
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
        <AppBootstrap>
          <Outlet />
        </AppBootstrap>
        <SystemDialog />
        <ModalContainer />
        <GlobalLoading />
        <Toaster position="top-center" richColors />
      </ThemeProvider>
    </JotaiProvider>
  );
}

function ShellDocument({ children }: PropsWithChildren) {
  const router = useRouter();
  const { i18n } = router.options.context;

  return (
    <html lang={i18n.language} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <HeadContent />
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
