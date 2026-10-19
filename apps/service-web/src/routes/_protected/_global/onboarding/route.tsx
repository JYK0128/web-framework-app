import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/auth';
import { z } from '@pkg/shared/common';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/_global/onboarding')({
  validateSearch: z.object({ callback: z.string().optional() }),
  beforeLoad: ({ context, location, search }) => {
    const user = context.user;
    if (!user) return;
    const termsRequired = context.terms.some((agreement) => agreement.isRequired && !agreement.isAgreed);
    const phoneVerificationRequired = SERVICE_AUTH_POLICY_CONFIG.phoneNumberVerificationRequired && !user.phoneNumberVerified;
    const twoFactorSetupRequired = SERVICE_AUTH_POLICY_CONFIG.twoFactorRequired && !user.twoFactorEnabled;
    const passwordChangeRequired = SERVICE_AUTH_POLICY_CONFIG.credentialAvailable && user.passwordExpired;
    const callback = getReturnPath(search.callback);

    if (termsRequired) {
      redirectTo(location.pathname, '/onboarding/agree-terms', callback);
      return;
    }
    if (phoneVerificationRequired) {
      redirectTo(location.pathname, '/onboarding/verify-phone', callback);
      return;
    }
    if (twoFactorSetupRequired) {
      redirectTo(location.pathname, '/onboarding/setup-2fa', callback);
      return;
    }
    if (passwordChangeRequired) {
      redirectTo(location.pathname, '/onboarding/change-password', callback);
      return;
    }
    throw redirect({ href: callback, replace: true });
  },
});

function getReturnPath(callback?: string): string {
  try {
    const origin = 'https://service.invalid';
    const url = new URL(callback ?? '/', origin);
    if (url.origin !== origin || url.pathname.startsWith('/onboarding/') || url.pathname === '/login' || url.pathname.startsWith('/login/')) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  }
  catch {
    return '/';
  }
}

function withCallback(path: string, callback: string): string {
  const url = new URL(path, 'https://service.invalid');
  url.searchParams.set('callback', callback);
  return `${url.pathname}${url.search}${url.hash}`;
}

function redirectTo(currentPath: string, requiredPath: string, callback: string): void {
  if (currentPath !== requiredPath) {
    throw redirect({ href: withCallback(requiredPath, callback), replace: true });
  }
}
