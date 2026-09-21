import { ApplicationError, DateUtil } from '@pkg/shared';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { toast } from 'sonner';

import { LoadingRouter } from '#/components/app';
import { SILENT_QUERY_PATHS } from '#/configs/app.config';
import { getI18n } from '#/core/isomorphic/i18n';

import { routeTree } from './routeTree.gen';

DateUtil.configure({
  timezone: 'Asia/Seoul',
  locale: 'ko-KR',
});

export function getRouter() {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        const path = query.queryKey[0];
        if (typeof path !== 'string' || SILENT_QUERY_PATHS.has(path)) return;
        toast.error(error.message);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const hasValidationDetails = error instanceof ApplicationError && Array.isArray(error.details);
        if (mutation.meta?.silent !== true && !hasValidationDetails) toast.error(error.message);
      },
      onSuccess: (data: unknown) => {
        const message = (data as { message?: unknown } | undefined)?.message;
        if (typeof message === 'string') toast.success(message);
      },
    }),
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
    context: { queryClient, i18n: getI18n() },
    defaultPendingComponent: LoadingRouter,
    scrollRestoration: true,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });
  return router;
}

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      silent?: boolean
    }
  }
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
