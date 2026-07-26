import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import { getSecurityNonce } from '#/core/server/security-nonce';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  // getRouter runs once per SSR request, so the query cache is never shared
  // between users on the server.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000 },
    },
  });
  const router = createRouter({
    routeTree,
    context: {
      queryClient,
      locale: undefined!,
      cspNonce: undefined!,
      userAgent: undefined!,
      host: undefined!,
      ip: undefined!,
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
