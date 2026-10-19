import { ADMIN_AUTH_POLICY_CONFIG } from '@pkg/shared/auth';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_public')({
  beforeLoad: ({ context, location }) => {
    const user = context.user;
    if (!user) return;
    const needsOnboarding = context.terms.some((agreement) => agreement.isRequired && !agreement.isAgreed)
      || (ADMIN_AUTH_POLICY_CONFIG.phoneNumberVerificationRequired && !user.phoneNumberVerified)
      || (ADMIN_AUTH_POLICY_CONFIG.twoFactorRequired && !user.twoFactorEnabled)
      || (ADMIN_AUTH_POLICY_CONFIG.credentialAvailable && user.passwordExpired);
    if (!needsOnboarding) return;

    const isLogin = location.pathname === '/login' || location.pathname.startsWith('/login/');
    const callback = isLogin
      ? new URLSearchParams(location.searchStr).get('callback') ?? '/profile'
      : `${location.pathname}${location.searchStr}${location.hash}`;
    throw redirect({ to: '/onboarding/agree-terms', search: { callback }, replace: true });
  },
  component: Outlet,
});
