import { createFileRoute, Outlet } from '@tanstack/react-router';

import { beforeLoadProtectedRoute } from '#/lib/route-access';

export const Route = createFileRoute('/_app/_protected')({
  beforeLoad: beforeLoadProtectedRoute,
  component: Outlet,
});
