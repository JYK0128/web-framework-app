import { createFileRoute, Outlet } from '@tanstack/react-router';

import { AppGuard } from '#/components/app';

export const Route = createFileRoute('/_protected')({
  component: ProtectedRoute,
});

function ProtectedRoute() {
  return (
    <AppGuard>
      <Outlet />
    </AppGuard>
  );
}
