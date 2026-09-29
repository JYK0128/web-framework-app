import { useLocation, useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { type PropsWithChildren, useEffect } from 'react';

import { LoadingRouter } from '#/components/app/loading-router';
import { authUserAtom } from '#/store/token';

const PROTECTED_PATHS = ['/qna', '/support', '/identity-verification', '/settings/security'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function AppGuard({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAtomValue(authUserAtom);
  const mustVerifyIdentity = Boolean(user?.identityVerificationRequired && !user.identityVerified);
  const mustSetupTwoFactor = Boolean(user?.twoFactorRequired && !user.twoFactorEnabled);
  const mustResetPassword = Boolean(user?.passwordExpired);
  const protectedPath = isProtectedPath(location.pathname);
  const isOAuthCallback = location.pathname === '/oauth/callback';

  useEffect(() => {
    if (isOAuthCallback) return;
    if (!user) {
      if (protectedPath) {
        void navigate({
          to: '/login',
          search: { callback: `${location.pathname}${location.searchStr}${location.hash}` },
          replace: true,
        });
      }
      return;
    }

    if (mustVerifyIdentity && location.pathname !== '/identity-verification') {
      void navigate({
        to: '/identity-verification',
        search: { callback: `${location.pathname}${location.searchStr}${location.hash}` },
        replace: true,
      });
    }
    else if (mustSetupTwoFactor && location.pathname !== '/settings/security') {
      void navigate({ to: '/settings/security', replace: true });
    }
    else if (mustResetPassword && location.pathname !== '/forgot-password') {
      void navigate({ to: '/forgot-password', replace: true });
    }
    else if (!mustVerifyIdentity && location.pathname === '/identity-verification') {
      void navigate({ to: '/qna', replace: true });
    }
  }, [isOAuthCallback, location.hash, location.pathname, location.searchStr, mustResetPassword, mustSetupTwoFactor, mustVerifyIdentity, navigate, protectedPath, user]);

  if (isOAuthCallback) return children;
  if (!user && protectedPath) return <LoadingRouter />;
  if (!user) return children;
  if (mustVerifyIdentity && location.pathname !== '/identity-verification') return <LoadingRouter />;
  if (mustSetupTwoFactor && location.pathname !== '/settings/security') return <LoadingRouter />;
  if (mustResetPassword && location.pathname !== '/forgot-password') return <LoadingRouter />;
  if (!mustVerifyIdentity && location.pathname === '/identity-verification') return <LoadingRouter />;
  return children;
}
