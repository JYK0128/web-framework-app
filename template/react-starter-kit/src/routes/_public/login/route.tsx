import { createFileRoute, redirect } from '@tanstack/react-router';

import { getAuthControllerUserProfileQueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { unauthenticatedOrThrow } from '#/core/auth/query-error';

export const Route = createFileRoute('/_public/login')({
  beforeLoad: async ({ context }) => {
    const profile = await context.queryClient
      .fetchQuery(getAuthControllerUserProfileQueryOptions({
        query: { staleTime: 60_000, gcTime: 60_000 },
      }))
      .catch(unauthenticatedOrThrow);

    if (profile) {
      throw redirect({ to: '/dashboard' });
    }
  },
});
