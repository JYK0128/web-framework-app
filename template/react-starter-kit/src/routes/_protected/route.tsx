import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { getAuthControllerUserProfileQueryOptions } from '#/.generated/api/endpoints/auth/auth';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ context }) => {
    const response = await context.queryClient
      .fetchQuery(getAuthControllerUserProfileQueryOptions())
      .catch(() => null);
    const profile = response?.data;
    if (!profile?.user) throw redirect({ to: '/login' });

    return {
      user: profile.user,
      expiresAt: profile.expiresAt,
    };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return <Outlet />;
}
