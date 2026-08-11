import { keepPreviousData, MutationCache, QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { createIsomorphicFn, getGlobalStartContext } from '@tanstack/react-start';
import { toast } from 'sonner';

import { LoadingRouter } from '#/components/app/loading-router';
import { createClientI18n } from '#/core/i18n';
import { getSecurityNonce } from '#/core/server/security-nonce';

import { routeTree } from './routeTree.gen';

const getRouterI18n = createIsomorphicFn()
  .server(() => {
    const i18n = getGlobalStartContext()?.i18n;
    if (!i18n) throw new Error('i18n middleware did not provide a request instance');
    return i18n;
  })
  .client(() => createClientI18n());

export function getRouter() {
  // getRouter runs once per SSR request, so the query cache is never shared
  // between users on the server.
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({
      onError: (error: unknown) => {
        const message = (error as { message?: string })?.message;
        if (message) {
          toast.error(message);
        }
      },
    }),
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        refetchInterval: false,
        refetchIntervalInBackground: false,
        placeholderData: keepPreviousData,
        throwOnError: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
        throwOnError: false,
        gcTime: 0,
      },
    },
  });
  const i18n = getRouterI18n();

  const router = createRouter({
    routeTree,
    defaultPendingComponent: LoadingRouter,
    context: {
      queryClient,
      i18n,
    },
    scrollRestoration: true,
    ssr: { nonce: getSecurityNonce() },
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
