import { createFileRoute, Outlet } from '@tanstack/react-router';

import { Maintenance } from './-components/maintenance';

export const Route = createFileRoute('/_app/_protected')({
  component: () => <Maintenance><Outlet /></Maintenance>,
});
