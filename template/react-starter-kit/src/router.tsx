import { createWebI18n } from '@pkg/shared/web';
import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { getGlobalStartContext } from '@tanstack/react-start';

import { LoadingRouter } from '#/components/app/loading-router';
import en from '#/core/locales/en.json';
import ko from '#/core/locales/ko.json';
import { getSecurityNonce } from '#/core/server/security-nonce';

import { routeTree } from './routeTree.gen';

const SUPPORTED_LOCALES = ['ko', 'en'] as const;

const i18nOptions = {
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
};

type StartContext = ReturnType<typeof getGlobalStartContext>;

function getPathLocale(pathname: string): string | undefined {
  const seg = /^\/([^/]+)/.exec(pathname)?.[1];
  return seg && (SUPPORTED_LOCALES as readonly string[]).includes(seg) ? seg : undefined;
}

function getLocale(ctx?: StartContext): string {
  if (ctx) {
    const pathLocale = getPathLocale(ctx.url?.pathname ?? '');
    if (pathLocale) return pathLocale;
    if (ctx.langCookie) return ctx.langCookie;
    if (ctx.acceptLanguage?.includes('ko')) return 'ko';
    if (ctx.acceptLanguage?.includes('en')) return 'en';
    return 'en';
  }

  return getPathLocale(window.location.pathname) ?? 'en';
}

export function getRouter() {
  // getRouter runs once per SSR request, so the query cache is never shared
  // between users on the server.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000 },
    },
  });
  const ctx = import.meta.env.SSR ? getGlobalStartContext() : undefined;
  const locale = getLocale(ctx);
  const i18n = createWebI18n(i18nOptions, locale);

  const router = createRouter({
    routeTree,
    defaultPendingComponent: LoadingRouter,
    context: {
      queryClient,
      i18n,
      locale,
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
