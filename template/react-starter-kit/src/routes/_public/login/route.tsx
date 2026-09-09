import { createFileRoute, redirect } from '@tanstack/react-router';

import { getAuthControllerMeQueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { QUERY_GC_TIME_60S, QUERY_STALE_TIME_60S } from '#/configs/query.config';
import { unauthenticatedOrThrow } from '#/core/auth/query-error';

export const Route = createFileRoute('/_public/login')({
  beforeLoad: async ({ context }) => {
    const profile = await context.queryClient
      .fetchQuery(getAuthControllerMeQueryOptions({
        query: { staleTime: QUERY_STALE_TIME_60S, gcTime: QUERY_GC_TIME_60S },
      }))
      .catch(unauthenticatedOrThrow);

    if (profile) {
      throw redirect({ to: '/dashboard' });
    }
  },
});
