import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { SessionActivityGuard } from '#/core/auth/session-activity-guard';

export const Route = createFileRoute('/_protected')({
  beforeLoad: ({ context }) => {
    const user = context.authSession?.user;
    if (!user) throw redirect({ to: '/login' });

    return {
      user,
      expiresAt: context.authSession?.expiresAt ?? null,
    };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { expiresAt } = Route.useRouteContext();

  return (
    <SessionActivityGuard expiresAt={expiresAt}>
      <Outlet />
    </SessionActivityGuard>
  );
}
