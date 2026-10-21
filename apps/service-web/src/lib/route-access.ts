import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { redirect } from '@tanstack/react-router';

import type { MeResponse } from '~/.generated/api/model';

type RouteAccessContext = {
  user: MeResponse | null
  terms: { isRequired: boolean, isAgreed: boolean }[]
};

type RouteLocation = {
  pathname: string
  searchStr: string
  hash: string
};

type RouteAccessOptions = {
  context: RouteAccessContext
  location: RouteLocation
};

function needsOnboarding(context: RouteAccessContext): boolean {
  const { user, terms } = context;
  return !!user && (
    terms.some((agreement) => agreement.isRequired && !agreement.isAgreed)
    || (SERVICE_AUTH_POLICY_CONFIG.phoneNumberVerificationRequired && !user.phoneNumberVerified)
    || (SERVICE_AUTH_POLICY_CONFIG.twoFactorRequired && !user.twoFactorEnabled)
    || (SERVICE_AUTH_POLICY_CONFIG.credentialAvailable && user.passwordExpired)
  );
}

export function beforeLoadProtectedRoute({ context, location }: RouteAccessOptions) {
  const isOnboarding = location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/');
  const callback = isOnboarding
    ? new URLSearchParams(location.searchStr).get('callback') ?? '/'
    : `${location.pathname}${location.searchStr}${location.hash}`;
  const { user } = context;
  if (!user) {
    // TanStack Router uses thrown redirect objects to interrupt route loading.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/login', search: { callback }, replace: true });
  }
  if (isOnboarding) return { user };
  if (needsOnboarding(context)) {
    // TanStack Router uses thrown redirect objects to interrupt route loading.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/onboarding/agree-terms', search: { callback }, replace: true });
  }
  return { user };
}

export function beforeLoadPublicRoute({ context, location }: RouteAccessOptions) {
  if (!context.user || !needsOnboarding(context)) return;

  const isLogin = location.pathname === '/login' || location.pathname.startsWith('/login/');
  const callback = isLogin
    ? new URLSearchParams(location.searchStr).get('callback') ?? '/'
    : `${location.pathname}${location.searchStr}${location.hash}`;
  // TanStack Router uses thrown redirect objects to interrupt route loading.
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw redirect({ to: '/onboarding/agree-terms', search: { callback }, replace: true });
}
