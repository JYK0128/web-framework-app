import { useI18n } from '@pkg/shared/web';
import { createFileRoute, Link, Outlet, redirect, useLocation } from '@tanstack/react-router';
import { KeyRound, Layers, LayoutDashboard, UserRound, Users } from 'lucide-react';
import { useState } from 'react';

import { getAuthControllerUserProfileQueryOptions } from '#/.generated/api/endpoints/auth/auth';
import type { UserProfileResponse } from '#/.generated/api/model';
import { cn } from '#/.generated/shadcn/lib/utils';
import { LocaleSwitcher, ProfileDropdown, ThemeToggle } from '#/components/app';
import { hasPermission, type PermissionName } from '#/core/auth/permissions';
import { SessionActivityGuard } from '#/core/auth/session-activity-guard';

import { PasswordChangeModal } from './profile/-components/modals/PasswordChangeModal';
import { PasswordChangeBanner } from './profile/-components/PasswordChangeBanner';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ context }) => {
    const response = await context.queryClient
      .fetchQuery(getAuthControllerUserProfileQueryOptions())
      .catch(() => null);
    const profile = response;
    if (!profile?.user) throw redirect({ to: '/login' });

    return {
      user: profile.user,
      expiresAt: profile.expiresAt,
    };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { user: contextUser, expiresAt } = Route.useRouteContext();

  return <ProtectedLayoutContent contextUser={contextUser} expiresAt={expiresAt} />;
}

function ProtectedLayoutContent({ contextUser, expiresAt }: { contextUser: UserProfileResponse, expiresAt: string | null }) {
  const [user, setUser] = useState(contextUser);
  const location = useLocation();
  const { t } = useI18n();
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const isOnboarding = location.pathname.startsWith('/onboarding');

  const handlePasswordDeferred = () => {
    setUser((currentUser) => ({
      ...currentUser,
      isPasswordChangeRequired: false,
    }));
  };

  const handlePasswordChanged = () => {
    setUser((currentUser) => ({
      ...currentUser,
      isPasswordChangeRequired: false,
      passwordUpdatedAt: new Date().toISOString(),
    }));
  };

  const navItems = [
    {
      title: t('navigation.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
      permission: undefined,
    },
    {
      title: t('navigation.users'),
      href: '/users',
      icon: Users,
      permission: 'user:read',
    },
    {
      title: t('navigation.permissions'),
      href: '/permission',
      icon: KeyRound,
      permission: 'role:read',
    },
    {
      title: t('navigation.profile'),
      href: '/profile',
      icon: UserRound,
      permission: undefined,
    },
  ] as const satisfies readonly { permission?: PermissionName }[];
  const visibleNavItems = navItems.filter(
    (item) => item.permission === undefined || hasPermission(user?.permissions, item.permission),
  );

  return (
    <SessionActivityGuard expiresAt={expiresAt}>
      <div className="grid h-full grid-rows-[auto_1fr] bg-background">
        {/* Protected Navigation Header */}
        <header className="
          sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md
        "
        >
          <div className="
            mx-auto flex h-16 max-w-7xl items-center justify-between px-4
            sm:px-6
          "
          >
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-6">
              <Link
                to="/dashboard"
                className="
                  flex items-center gap-2.5 font-extrabold tracking-tight
                "
              >
                <div className="
                  flex size-8 items-center justify-center rounded-lg bg-primary
                  text-primary-foreground shadow-xs
                "
                >
                  <Layers className="size-4" />
                </div>
                <span className="text-base font-black">STARTER KIT</span>
              </Link>

              {/* Main Nav Links */}
              <nav className="
                hidden items-center gap-1
                md:flex
              "
              >
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? location.pathname === '/dashboard' || location.pathname === '/dashboard/'
                    : location.pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        `
                          flex items-center gap-2 rounded-lg px-3 py-2 text-xs
                          font-semibold transition-colors
                        `,
                        isActive
                          ? `bg-primary/10 text-primary`
                          : `
                            text-muted-foreground
                            hover:bg-accent hover:text-accent-foreground
                          `,
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Side Options (Theme, Locale, Profile Menu) */}
            <div className="flex items-center gap-3">
              <LocaleSwitcher />
              <ThemeToggle />

              <ProfileDropdown user={user} />
            </div>
          </div>

          {/* Mobile Bottom Nav */}
          <div className="
            flex items-center justify-around border-t border-border px-2 py-1.5
            md:hidden
          "
          >
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === '/dashboard' || location.pathname === '/dashboard/'
                : location.pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    `
                      flex flex-col items-center gap-1 rounded-md px-3 py-1.5
                      text-[10px] font-medium transition-colors
                    `,
                    isActive
                      ? `text-primary font-bold`
                      : `text-muted-foreground`,
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>

          {!isOnboarding && (
            <div className="border-t border-border bg-background/80">
              <div className="
                mx-auto max-w-7xl px-4 pt-4
                sm:px-6
              "
              >
                <PasswordChangeBanner
                  user={user}
                  onChangeClick={() => setShowPasswordChangeModal(true)}
                  onDeferred={handlePasswordDeferred}
                />
              </div>
            </div>
          )}
        </header>

        {/* Page Main Content */}
        <main className="overflow-hidden">
          <Outlet />
        </main>

        {!isOnboarding && (
          <PasswordChangeModal
            user={user}
            open={showPasswordChangeModal}
            onOpenChange={setShowPasswordChangeModal}
            onPasswordChanged={handlePasswordChanged}
          />
        )}
      </div>
    </SessionActivityGuard>
  );
}
