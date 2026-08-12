import { useI18n } from '@pkg/shared/web';
import { createFileRoute, Link, Outlet, redirect, useLocation } from '@tanstack/react-router';
import { KeyRound, Layers, LayoutDashboard, UserRound, Users } from 'lucide-react';

import { getAuthControllerUserProfileQueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { cn } from '#/.generated/shadcn/lib/utils';
import { LocaleSwitcher, ProfileDropdown, ThemeToggle } from '#/components/app';
import { hasPermission } from '#/core/auth/permissions';
import { SessionActivityGuard } from '#/core/auth/session-activity-guard';

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
  const { user, expiresAt } = Route.useRouteContext();
  const location = useLocation();
  const { t } = useI18n();

  const navItems = [
    {
      title: t('navigation.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      exact: true,
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
    },
  ] as const;
  const visibleNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(user?.permissions, item.permission),
  );

  return (
    <SessionActivityGuard expiresAt={expiresAt}>
      <div className="flex min-h-screen flex-col bg-background">
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
        </header>

        {/* Page Main Content */}
        <main className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </SessionActivityGuard>
  );
}
