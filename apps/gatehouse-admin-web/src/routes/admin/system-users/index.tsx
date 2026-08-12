import { createFileRoute, redirect } from '@tanstack/react-router';

import { AdminFrame } from '#/components/layout';
import { SessionActivityGuard } from '#/core/auth/session-activity-guard';

export const Route = createFileRoute('/admin/system-users/')({
  beforeLoad: ({ context }) => {
    const profile = context.authSession?.user;
    if (!profile) throw redirect({ to: '/login' });
    if (profile.role !== 'admin' && profile.role !== 'super-admin') {
      throw redirect({ to: '/' });
    }
    return { profile, expiresAt: context.authSession?.expiresAt ?? null };
  },
  component: AdminSystemUsersPage,
});

function AdminSystemUsersPage() {
  const { profile, expiresAt } = Route.useRouteContext();

  return (
    <SessionActivityGuard expiresAt={expiresAt}>
      <AdminFrame user={profile} title="관리자 계정 관리">
        <div className="min-h-[calc(100vh-8rem)] w-full rounded-lg bg-background" />
      </AdminFrame>
    </SessionActivityGuard>
  );
}
