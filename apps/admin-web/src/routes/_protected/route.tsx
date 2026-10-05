import type { QueryClient } from '@tanstack/react-query';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { getAuthControllerGetPolicyV1QueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { getOperatorTermsControllerGetAgreementsV1QueryOptions } from '#/.generated/api/endpoints/operator-terms/operator-terms';
import type { MeResponse } from '#/.generated/api/model';

type ProtectedRedirect = string | undefined;

async function getRequiredRedirect(
  queryClient: QueryClient,
  location: { pathname: string, searchStr: string, hash: string },
  user: MeResponse,
  callback: string,
): Promise<ProtectedRedirect> {
  const agreements = await queryClient.fetchQuery(
    getOperatorTermsControllerGetAgreementsV1QueryOptions(),
  );
  const hasUnagreedRequiredTerm = agreements.items.some((term) => term.isRequired && !term.isAgreed);
  if (hasUnagreedRequiredTerm) {
    return location.pathname === '/onboarding/agree-terms' ? undefined : withCallback('/onboarding/agree-terms', callback);
  }

  const policy = await queryClient.fetchQuery(getAuthControllerGetPolicyV1QueryOptions());
  const requiredPath = getRequiredSecurityPath(policy, user);
  if (requiredPath) return location.pathname === requiredPath ? undefined : withCallback(requiredPath, callback);

  if (!hasUnagreedRequiredTerm && location.pathname.startsWith('/onboarding/')) return resolveCompletionDestination(callback);
  return undefined;
}

function getRequiredSecurityPath(
  policy: { phoneNumberVerificationRequired: boolean, twoFactorRequired: boolean },
  user: MeResponse,
): string | undefined {
  if (policy.phoneNumberVerificationRequired && !user.phoneNumberVerified) return '/onboarding/verify-phone';
  if (policy.twoFactorRequired && !user.twoFactorEnabled) return '/onboarding/setup-2fa';
  if (user.passwordExpired) return '/onboarding/change-password';
  return undefined;
}

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ context, location }) => {
    const callback = getCallback(location);
    const user = context.user;
    if (!user) {
      throw redirect({ to: '/login', search: { callback }, replace: true });
    }

    const redirectTo = await getRequiredRedirect(context.queryClient, location, user, callback);

    if (redirectTo) throw redirect({ href: redirectTo, replace: true });
    return { user };
  },
  component: ProtectedRoute,
});

function ProtectedRoute() {
  return <Outlet />;
}

function getCallback(location: { pathname: string, searchStr: string, hash: string }): string {
  const isOnboardingRoute = location.pathname.startsWith('/onboarding/');
  return (isOnboardingRoute ? new URLSearchParams(location.searchStr).get('callback') : null)
    ?? `${location.pathname}${location.searchStr}${location.hash}`;
}

function withCallback(path: string, callback: string): string {
  const url = new URL(path, 'https://admin.invalid');
  url.searchParams.set('callback', callback);
  return `${url.pathname}${url.search}${url.hash}`;
}

function resolveDestination(callback?: string): string | undefined {
  if (!callback) return undefined;
  try {
    const url = new URL(callback, 'https://admin.invalid');
    if (url.origin !== 'https://admin.invalid') return undefined;
    return `${url.pathname}${url.search}${url.hash}`;
  }
  catch {
    return undefined;
  }
}

function resolveCompletionDestination(callback: string): string {
  const destination = resolveDestination(callback);
  if (!destination) return '/profile';
  const pathname = new URL(destination, 'https://admin.invalid').pathname;
  if (pathname.startsWith('/onboarding/') || pathname === '/login' || pathname.startsWith('/login/')) return '/profile';
  return destination;
}
