import { DateUtil } from '@pkg/shared';
import { DEFAULT_TIMEZONE } from '@pkg/shared/common';
import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { createIsomorphicFn, getGlobalStartContext } from '@tanstack/react-start';

import { LoadingRouter } from '#/components/app';
import { getI18n } from '#/i18n/i18n';

import { routeTree } from './routeTree.gen';

DateUtil.configure({
  timezone: DEFAULT_TIMEZONE,
  locale: 'ko-KR',
});

const getCspNonce = createIsomorphicFn()
  .server(() => (getGlobalStartContext() as { nonce?: string } | undefined)?.nonce)
  .client(() => document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce);

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 0,
      },
      mutations: { retry: false },
    },
  });
  const router = createRouter({
    routeTree,
    ssr: { nonce: getCspNonce() },
    context: { queryClient, i18n: getI18n() },
    defaultPendingComponent: LoadingRouter,
    scrollRestoration: true,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });
  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
