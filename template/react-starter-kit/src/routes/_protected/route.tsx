import { createFileRoute, Link, Outlet, redirect, useLocation } from '@tanstack/react-router';
import { KeyRound, Layers, LayoutDashboard, User as UserIcon, Users } from 'lucide-react';

import { getAuthControllerUserProfileQueryOptions } from '#/.generated/api/endpoints/auth/auth';
import { Avatar, AvatarFallback, Badge } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { LocaleSwitcher } from '#/components/app/locale-switcher';
import { ThemeToggle } from '#/components/app/theme-toggle';
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
  const context = Route.useRouteContext();
  const user = context.user as { name?: string, email?: string, role?: string } | undefined;
  const expiresAt = context.expiresAt;
  const location = useLocation();

  const navItems = [
    {
      title: '대시보드',
      href: '/',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: '회원 관리',
      href: '/users',
      icon: Users,
    },
    {
      title: '권한 관리',
      href: '/permission',
      icon: KeyRound,
    },
    {
      title: '프로필',
      href: '/profile',
      icon: UserIcon,
    },
  ];

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
                to="/"
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
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? location.pathname === '/' || location.pathname === ''
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

            {/* Right Side Options (Theme, Locale, User Avatar) */}
            <div className="flex items-center gap-3">
              <LocaleSwitcher />
              <ThemeToggle />

              <Link to="/profile" className="flex items-center gap-2">
                <Avatar className="
                  size-8 transition-transform
                  hover:scale-105
                "
                >
                  <AvatarFallback className="
                    bg-primary/10 text-primary text-xs font-bold
                  "
                  >
                    {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="
                  hidden flex-col text-left
                  md:flex
                "
                >
                  <span className="
                    text-xs font-bold leading-none text-foreground
                  "
                  >
                    {user?.name || '사용자'}
                  </span>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className="h-4 px-1 text-[9px] font-mono"
                    >
                      {user?.role ? user.role.toUpperCase() : 'USER'}
                    </Badge>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Mobile Bottom Nav */}
          <div className="
            flex items-center justify-around border-t border-border px-2 py-1.5
            md:hidden
          "
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === '/' || location.pathname === ''
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
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </SessionActivityGuard>
  );
}
