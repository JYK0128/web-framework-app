import { keepPreviousData, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { toast } from 'sonner';

import { LoadingRouter } from '#/components/app/loading-router';
import { getCspNonce } from '#/core/isomorphic/csp-nonce';
import { getI18n } from '#/core/isomorphic/i18n';

import { routeTree } from './routeTree.gen';

const SILENT_QUERY_PATHS = new Set([
  '/api/v1/auth/me',
  '/api/v1/health',
]);

const SILENT_MUTATION_PATHS = new Set([
  '/api/v1/auth/logout',
  '/api/v1/auth/consent/sync',
]);

export function getRouter() {
  // getRouter runs once per SSR request, so the query cache is never shared
  // between users on the server.
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        const path = query.queryKey[0];
        if (typeof path !== 'string' || SILENT_QUERY_PATHS.has(path)) return;

        const message = (error as { message?: string })?.message;
        if (message) {
          toast.error(message);
        }
      },
    }),
    mutationCache: new MutationCache({
      onSuccess: (data: unknown, _variables, _context, mutation) => {
        const message = (mutation.meta as { successMessage?: string } | undefined)?.successMessage
          || (data as { message?: string } | undefined)?.message;

        if (message) {
          toast.success(message);
        }
      },
      onError: (error: unknown, _variables, _context, mutation) => {
        if ((mutation.meta as { silent?: boolean } | undefined)?.silent) return;

        const errorPath = (error as { response?: { config?: { url?: string } } })?.response?.config?.url;
        if (typeof errorPath === 'string' && SILENT_MUTATION_PATHS.has(errorPath)) return;

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
  const i18n = getI18n();

  const router = createRouter({
    routeTree,
    defaultPendingComponent: LoadingRouter,
    context: {
      queryClient,
      i18n,
    },
    scrollRestoration: true,
    ssr: { nonce: getCspNonce() },
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
