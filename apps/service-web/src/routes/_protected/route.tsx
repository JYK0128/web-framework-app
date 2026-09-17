import { ApplicationError } from '@pkg/shared/common';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { currentUserQueryOptions } from '#/core/api/auth';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ context }) => {
    try {
      const user = await context.queryClient.ensureQueryData(currentUserQueryOptions());
      return { user };
    }
    catch (error) {
      if (error instanceof ApplicationError && error.status === 401) {
        throw redirect({ to: '/login' });
      }
      throw error;
    }
  },
  component: Outlet,
});
