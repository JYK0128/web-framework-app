import { createFileRoute, Outlet } from '@tanstack/react-router';

import { AppLayout } from '#/components/layout';

export const Route = createFileRoute('/_protected/_app')({
  component: ProtectedAppLayout,
});

function ProtectedAppLayout() {
  const { user } = Route.useRouteContext();

  return (
    <AppLayout user={user}>
      <Outlet />
    </AppLayout>
  );
}
