import { createFileRoute, redirect } from '@tanstack/react-router';

import { AdminFrame } from '#/components/layout';
import { SessionActivityGuard } from '#/core/auth/session-activity-guard';

export const Route = createFileRoute('/admin/users/')({
  beforeLoad: ({ context }) => {
    const profile = context.authSession?.user;
    if (!profile) throw redirect({ to: '/login' });
    if (profile.role !== 'admin' && profile.role !== 'super-admin') {
      throw redirect({ to: '/' });
    }
    return { profile, expiresAt: context.authSession?.expiresAt ?? null };
  },
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { profile, expiresAt } = Route.useRouteContext();

  return (
    <SessionActivityGuard expiresAt={expiresAt}>
      <AdminFrame user={profile} title="서비스 회원 관리">
        <div className="min-h-[calc(100vh-8rem)] w-full rounded-lg bg-background" />
      </AdminFrame>
    </SessionActivityGuard>
  );
}
