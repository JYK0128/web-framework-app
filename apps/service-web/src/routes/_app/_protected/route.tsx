import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { isAxiosError } from 'axios';

import { getAuthControllerMeV1QueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { authUserAtom, tokenStore } from '#/store/token';

function unauthenticatedOrThrow(error: unknown): null {
  if (error instanceof ApplicationError && (error.status === 401 || error.code === 'AUTH_SESSION_EXPIRED')) return null;
  if (isAxiosError(error) && error.response?.status === 401) return null;
  throw error;
}

export const Route = createFileRoute('/_app/_protected')({
  beforeLoad: async ({ context, location }) => {
    if (typeof window === 'undefined') return;

    const response = await context.queryClient
      .fetchQuery(getAuthControllerMeV1QueryOptions({
        query: { staleTime: TimeUtil.ms.minute(1) },
      }))
      .catch(unauthenticatedOrThrow);

    const user = response?.data ?? null;
    tokenStore.set(authUserAtom, user);
    if (!user) {
      throw redirect({
        to: '/login',
        search: { callback: `${location.pathname}${location.searchStr}${location.hash}` },
      });
    }

    return { user };
  },
  component: Outlet,
});
