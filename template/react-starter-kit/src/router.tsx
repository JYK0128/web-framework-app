import { createWebI18n } from '@pkg/shared/web';
import { keepPreviousData, MutationCache, QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { getGlobalStartContext } from '@tanstack/react-start';
import { toast } from 'sonner';

import { LoadingRouter } from '#/components/app/loading-router';
import enLocales from '#/core/locales/en.json';
import koLocales from '#/core/locales/ko.json';
import { getSecurityNonce } from '#/core/server/security-nonce';

import { routeTree } from './routeTree.gen';

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
  const { locale } = getGlobalStartContext() || {};
  const i18n = createWebI18n({
    lng: locale,
    resources: {
      en: { translation: enLocales },
      ko: { translation: koLocales },
    },
  });

  const router = createRouter({
    routeTree,
    defaultPendingComponent: LoadingRouter,
    context: {
      queryClient,
      i18n,
      locale: i18n.language,
      user: null,
      expiresAt: null,
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
