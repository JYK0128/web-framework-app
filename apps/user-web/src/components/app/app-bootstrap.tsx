import { ApplicationError } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { useAtomValue, useSetAtom } from 'jotai';
import { type ReactNode, useCallback, useEffect, useRef } from 'react';

import { authControllerRefreshV1, getAuthControllerMeV1QueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { loading } from '#/components/app/global-loading';
import { LoadingRouter } from '#/components/app/loading-router';
import { authUserAtom, clearAuthState } from '#/store/auth';
import { tokenStorage } from '#/store/token';

const PUBLIC_PATHS = new Set(['/', '/login', '/find-account', '/reset-password']);

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

function isLoginPath(pathname: string): boolean {
  return pathname === '/login';
}

function isUnauthorized(error: unknown): boolean {
  return (error instanceof ApplicationError && error.status === 401)
    || (isAxiosError(error) && error.response?.status === 401);
}

export function AppBootstrap({ children }: Readonly<{ children: ReactNode }>) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAtomValue(authUserAtom);
  const setUser = useSetAtom(authUserAtom);
  const refreshRequest = useRef<Promise<unknown> | null>(null);

  const ensureAccessToken = useCallback(() => {
    if (tokenStorage.getAccessToken()) return Promise.resolve();
    if (!refreshRequest.current) {
      refreshRequest.current = authControllerRefreshV1({}).finally(() => {
        refreshRequest.current = null;
      });
    }
    return refreshRequest.current;
  }, []);

  useEffect(() => {
    if (isPublicPath(location.pathname) && !isLoginPath(location.pathname)) {
      return;
    }

    let cancelled = false;

    const redirectToProfile = async () => {
      await navigate({ to: '/profile', replace: true });
    };

    const bootstrapLogin = async () => {
      await loading(ensureAccessToken, '인증 확인 중...');
      if (!cancelled) await redirectToProfile();
    };

    const bootstrapProtectedRoute = async () => {
      if (user) return;

      await ensureAccessToken();

      const me = await queryClient.fetchQuery(getAuthControllerMeV1QueryOptions());
      if (cancelled) return;

      setUser(me.data);
    };

    const handleBootstrapError = async (error: unknown) => {
      if (cancelled) return;
      if (isLoginPath(location.pathname) && isUnauthorized(error)) return;

      clearAuthState();
      await navigate({ to: '/login', replace: true });
    };

    const bootstrap = async () => {
      try {
        if (isLoginPath(location.pathname)) return await bootstrapLogin();
        await bootstrapProtectedRoute();
      }
      catch (error) {
        await handleBootstrapError(error);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [ensureAccessToken, location.pathname, navigate, queryClient, setUser, user]);

  if (isPublicPath(location.pathname) || user) return children;
  return <LoadingRouter />;
}
