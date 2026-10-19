import { createFileRoute, Outlet } from '@tanstack/react-router';

import { AppLayout } from '#/components/layout';

export const Route = createFileRoute('/_public/_app')({ component: PublicAppLayoutRoute });

function PublicAppLayoutRoute() {
  const { user } = Route.useRouteContext();
  return (
    <AppLayout user={user}>
      <Outlet />
    </AppLayout>
  );
}
