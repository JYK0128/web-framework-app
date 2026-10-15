import { createFileRoute, Outlet } from '@tanstack/react-router';

import { beforeLoadProtectedRoute } from '#/lib/route-access';
import { Maintenance } from '#/routes/_protected/-components/maintenance';

export const Route = createFileRoute('/_app/_protected')({
  beforeLoad: beforeLoadProtectedRoute,
  component: ProtectedAppOutlet,
});

function ProtectedAppOutlet() {
  return <Maintenance><Outlet /></Maintenance>;
}
