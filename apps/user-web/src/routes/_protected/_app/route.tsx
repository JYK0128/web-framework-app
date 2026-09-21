import { createFileRoute, Outlet } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';

import { AppLayout } from '#/components/layout';
import { authUserAtom } from '#/store/auth';

export const Route = createFileRoute('/_protected/_app')({ component: ProtectedAppLayout });

function ProtectedAppLayout() {
  const user = useAtomValue(authUserAtom);
  if (!user) return null;
  return <AppLayout user={user}><Outlet /></AppLayout>;
}
