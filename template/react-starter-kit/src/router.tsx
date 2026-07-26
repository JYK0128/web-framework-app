import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createRouter({
    routeTree,
    context: {
      locale: undefined!,
      cspNonce: undefined!,
      userAgent: undefined!,
      host: undefined!,
      ip: undefined!,
    },
    scrollRestoration: true,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
