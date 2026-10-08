import { ADMIN_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected')({
  beforeLoad: ({ context, location }) => {
    const isOnboarding = location.pathname === '/onboarding' || location.pathname.startsWith('/onboarding/');
    const callback = isOnboarding
      ? new URLSearchParams(location.searchStr).get('callback') ?? '/profile'
      : `${location.pathname}${location.searchStr}${location.hash}`;
    const user = context.user;
    if (!user) {
      throw redirect({ to: '/login', search: { callback }, replace: true });
    }
    if (isOnboarding) return { user };
    const needsOnboarding = context.terms.some((agreement) => agreement.isRequired && !agreement.isAgreed)
      || (ADMIN_AUTH_POLICY_CONFIG.phoneNumberVerificationRequired && !user.phoneNumberVerified)
      || (ADMIN_AUTH_POLICY_CONFIG.twoFactorRequired && !user.twoFactorEnabled)
      || (ADMIN_AUTH_POLICY_CONFIG.credentialAvailable && user.passwordExpired);
    if (needsOnboarding) {
      throw redirect({ to: '/onboarding/agree-terms', search: { callback }, replace: true });
    }
    return { user };
  },
  component: Outlet,
});
