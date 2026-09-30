import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { type PropsWithChildren, useEffect, useState } from 'react';

import { authControllerRefreshV1, getAuthControllerMeV1QueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { LoadingRouter } from '#/components/app/loading-router';
import { authUserAtom, tokenStorage, tokenStore } from '#/store/token';

const PROTECTED_PATHS = ['/qna', '/support', '/identity-verification', '/settings/security'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function AppBootstrap({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [checkedPath, setCheckedPath] = useState(location.pathname);
  const protectedPath = isProtectedPath(location.pathname);

  useEffect(() => {
    if (typeof window === 'undefined' || location.pathname === '/oauth/callback') return;

    // Reopen the loading gate for each protected navigation while auth state is refreshed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsChecking(true);
    const restoreSession = async () => {
      if (!tokenStorage.getAccessToken()) await authControllerRefreshV1({});
      const response = await queryClient.fetchQuery(
        getAuthControllerMeV1QueryOptions({ query: { retry: false } }),
      );
      tokenStore.set(authUserAtom, response);
    };

    void restoreSession()
      .catch(async () => {
        tokenStorage.clear();
        if (protectedPath) {
          await navigate({
            to: '/login',
            search: { callback: `${location.pathname}${location.searchStr}${location.hash}` },
            replace: true,
          });
        }
      })
      .finally(() => {
        setCheckedPath(location.pathname);
        setIsChecking(false);
      });
  }, [location.hash, location.pathname, location.searchStr, navigate, protectedPath, queryClient]);

  if (protectedPath && (isChecking || checkedPath !== location.pathname)) return <LoadingRouter />;
  return children;
}
