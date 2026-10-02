import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { getAuthControllerGetPolicyV1QueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { getServiceTermsControllerGetAgreementsV1QueryOptions } from '#/.generated/api/endpoints/service-terms/service-terms';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ context, location }) => {
    const callback = getCallback(location);
    const user = context.user;
    if (!user) {
      throw redirect({
        to: '/login',
        search: { callback },
        replace: true,
      });
    }

    const agreements = await context.queryClient.fetchQuery(
      getServiceTermsControllerGetAgreementsV1QueryOptions(),
    );
    const policy = await context.queryClient.fetchQuery(getAuthControllerGetPolicyV1QueryOptions());
    let requiredPath: string | undefined;
    if (agreements.items.some((agreement) => agreement.isRequired && !agreement.isAgreed)) requiredPath = '/onboarding/terms';
    else if (policy.phoneNumberVerificationRequired && !user.phoneNumberVerified) requiredPath = '/onboarding/phone-number-verification';
    else if (policy.twoFactorRequired && !user.twoFactorEnabled) requiredPath = '/onboarding/2fa';
    else if (user.passwordExpired) requiredPath = '/onboarding/change-password';

    if (requiredPath && location.pathname !== requiredPath) {
      throw redirect({
        href: withCallback(requiredPath, callback),
        replace: true,
      });
    }

    if (!requiredPath && location.pathname.startsWith('/onboarding/')) {
      throw redirect({ href: resolveCompletionDestination(callback), replace: true });
    }

    return { user };
  },
  component: Outlet,
});

function getCallback(location: { pathname: string, searchStr: string, hash: string }): string {
  if (location.pathname.startsWith('/onboarding/')) {
    return new URLSearchParams(location.searchStr).get('callback') ?? '/';
  }
  return `${location.pathname}${location.searchStr}${location.hash}`;
}

function withCallback(path: string, callback: string): string {
  const url = new URL(path, 'https://service.invalid');
  url.searchParams.set('callback', callback);
  return `${url.pathname}${url.search}${url.hash}`;
}

function resolveCompletionDestination(callback: string): string {
  try {
    const origin = 'https://service.invalid';
    const url = new URL(callback, origin);
    if (url.origin !== origin || url.pathname.startsWith('/onboarding/') || url.pathname === '/login' || url.pathname.startsWith('/login/')) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  }
  catch {
    return '/';
  }
}
