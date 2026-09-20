import '#/styles/styles.css';

import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { Provider as JotaiProvider } from 'jotai';
import type { PropsWithChildren } from 'react';

import { Toaster } from '#/.generated/shadcn/components/ui';
import { AppBootstrap, GlobalLoading, RouterError, RouterNotFound, SystemDialog, ThemeProvider } from '#/components/app';
import { ModalContainer } from '#/components/modal';
import { tokenStore } from '#/store/token';

export type AppRouterContext = {
  queryClient: QueryClient
};

export const Route = createRootRouteWithContext<AppRouterContext>()({
  head: () => ({
    meta: [
      { title: 'Admin Web' },
      { name: 'description', content: 'Admin Web application' },
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
