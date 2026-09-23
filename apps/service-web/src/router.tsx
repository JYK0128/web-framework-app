import { DateUtil } from '@pkg/shared';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { toast } from 'sonner';

import { LoadingRouter } from '#/components/app';

import { routeTree } from './routeTree.gen';

DateUtil.configure({
  timezone: 'Asia/Seoul',
  locale: 'ko-KR',
});

export function getRouter() {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        const isAuthPrincipalQuery = query.queryKey[0] === '/api/v1/auth/me';
        const status = error instanceof Error && 'status' in error
          ? (error as Error & { status?: number }).status
          : undefined;
        if (isAuthPrincipalQuery && status === 401) return;
        toast.error(error.message);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.silent !== true) toast.error(error.message);
      },
      onSuccess: (_data, _variables, _context, mutation) => {
        const message = mutation.meta?.successMessage;
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
    context: { queryClient },
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
      successMessage?: string
    }
  }
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
