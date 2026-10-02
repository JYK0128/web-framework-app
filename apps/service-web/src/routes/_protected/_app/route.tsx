import { createFileRoute, Outlet } from '@tanstack/react-router';

import { AppLayout } from '#/components/layout';
import { Maintenance } from '#/routes/_protected/-components/maintenance';

export const Route = createFileRoute('/_protected/_app')({ component: AppLayoutRoute });

function AppLayoutRoute() {
  const { user } = Route.useRouteContext();
  return (
    <AppLayout user={user}>
      <Maintenance><Outlet /></Maintenance>
    </AppLayout>
  );
}
