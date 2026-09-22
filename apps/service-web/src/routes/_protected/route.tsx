import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { isAxiosError } from 'axios';

import { getAuthControllerMeV1QueryOptions } from '#/.generated/api/endpoints/auth/auth';

function unauthenticatedOrThrow(error: unknown): null {
  if (error instanceof ApplicationError && error.status === 401) return null;
  if (isAxiosError(error) && error.response?.status === 401) return null;
  if (typeof error === 'object' && error !== null && 'status' in error && (error as { status?: number }).status === 401) return null;
  throw error;
}

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ context, location }) => {
    const response = await context.queryClient
      .fetchQuery(getAuthControllerMeV1QueryOptions({
        query: { staleTime: TimeUtil.ms.minute(1) },
      }))
      .catch(unauthenticatedOrThrow);

    if (!response) {
      throw redirect({
        to: '/login',
        search: { callback: location.href },
      });
    }

    return { user: response.data };
  },
  component: Outlet,
});
