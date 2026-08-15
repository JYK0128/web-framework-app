import { useI18n } from '@pkg/shared/web';
import { createFileRoute, Link, Outlet, redirect, useLocation } from '@tanstack/react-router';
import { Activity, FileText, HelpCircle, KeyRound, Layers, LayoutDashboard, type LucideIcon, Megaphone, Menu, MessageSquareQuote, PanelLeftClose, PanelLeftOpen, Settings, UserRound, Users } from 'lucide-react';
import { useState } from 'react';

import { getAuthControllerUserProfileQueryOptions } from '#/.generated/api/endpoints/auth/auth';
import type { UserProfileResponse } from '#/.generated/api/model';
import { Button, Sheet, SheetContent, SheetTrigger, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { LocaleSwitcher, NoticeBell, ProfileDropdown, ThemeToggle } from '#/components/app';
import { hasPermission, type PermissionName } from '#/core/auth/permissions';

import { PasswordChangeModal } from './profile/-components/modals/PasswordChangeModal';
import { PasswordChangeBanner } from './profile/-components/PasswordChangeBanner';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ context }) => {
    const response = await context.queryClient
      .fetchQuery(getAuthControllerUserProfileQueryOptions())
      .catch(() => null);
    const profile = response;
    if (!profile) throw redirect({ to: '/login' });

    return {
      user: profile,
    };
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  const { user: contextUser } = Route.useRouteContext();

  return <ProtectedLayoutContent contextUser={contextUser} />;
}

function ProtectedLayoutContent({ contextUser }: { contextUser: UserProfileResponse }) {
  const [user, setUser] = useState(contextUser);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const navGroups = [
    {
      title: t('navigation.groupService'),
      items: [
        {
          title: t('navigation.dashboard'),
          href: '/dashboard',
          icon: LayoutDashboard,
          permission: undefined,
        },
        {
          title: t('navigation.announcements'),
          href: '/announcements',
          icon: Megaphone,
          permission: undefined,
        },
        {
          title: t('navigation.faq'),
          href: '/faq',
          icon: HelpCircle,
          permission: undefined,
        },
        {
          title: t('navigation.profile'),
          href: '/profile',
          icon: UserRound,
          permission: undefined,
        },
      ],
    },
    {
      title: t('navigation.groupOperations'),
      items: [
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
          title: t('navigation.terms'),
          href: '/terms',
          icon: FileText,
          permission: 'term:read',
        },
        {
          title: t('navigation.notices'),
          href: '/notices',
          icon: Megaphone,
          permission: 'notice:manage',
        },
        {
          title: t('navigation.faqs'),
          href: '/faqs',
          icon: MessageSquareQuote,
          permission: 'faq:read',
        },
        {
          title: t('navigation.activityLogs'),
          href: '/activity-logs',
          icon: Activity,
          permission: undefined,
        },
        {
          title: t('navigation.systemSettings'),
          href: '/system-settings',
          icon: Settings,
          permission: undefined,
        },
      ],
    },
  ] as const satisfies readonly {
    title: string
    items: readonly {
      title: string
      href: string
      icon: LucideIcon
      permission?: PermissionName
    }[]
  }[];

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.permission === undefined || hasPermission(user?.permissions, item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const currentNav = visibleNavGroups
    .flatMap((group) => group.items)
    .find((item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`));

  const renderNavLinks = (collapsed = false, onItemClick?: () => void) => (
    <TooltipProvider delay={100}>
      <nav className={cn('flex flex-col gap-4 py-2', collapsed
        ? `items-center px-2`
        : `px-3`)}
      >
        {visibleNavGroups.map((group, groupIdx) => (
          <div
            key={group.title}
            className={cn('flex w-full flex-col gap-1', collapsed && `
              items-center
            `)}
          >
            {!collapsed
              ? (
                <div className="
                  px-3.5 pb-1 text-[11px] font-bold tracking-wider
                  text-muted-foreground uppercase
                "
                >
                  {group.title}
                </div>
              )
              : groupIdx > 0
                ? (
                  <div className="my-1.5 h-px w-6 bg-border" />
                )
                : null}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href
                || location.pathname.startsWith(`${item.href}/`);

              const linkElement = (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onItemClick}
                  className={cn(
                    `
                      flex items-center rounded-lg text-sm font-medium
                      transition-all
                    `,
                    collapsed ? 'size-10 justify-center' : 'gap-3 px-3.5 py-2.5',
                    isActive
                      ? `
                        bg-primary text-primary-foreground font-semibold
                        shadow-xs
                      `
                      : `
                        text-muted-foreground
                        hover:bg-accent hover:text-accent-foreground
                      `,
                  )}
                >
                  <Icon className="size-4.5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger
                      render={(props) => (
                        <div {...props} className="flex w-full justify-center">
                          {linkElement}
                        </div>
                      )}
                    />
                    <TooltipContent
                      side="right"
                      sideOffset={8}
                      className="text-xs font-semibold"
                    >
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkElement;
            })}
          </div>
        ))}
      </nav>
    </TooltipProvider>
  );

  if (isOnboarding) {
    return (
      <div className="size-full overflow-hidden bg-background">
        <main className="size-full overflow-hidden">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex size-full overflow-hidden bg-background">
      {/* Desktop Left Sidebar */}
      <aside
        className={cn(
          `
            hidden shrink-0 flex-col border-r border-border bg-card/95
            backdrop-blur-md transition-all duration-300
            md:flex
          `,
          isCollapsed ? 'w-18' : 'w-64',
        )}
      >
        {/* Brand Logo & Title */}
        <div
          className={cn(
            `
              flex h-16 shrink-0 items-center border-b border-border
              transition-all duration-300
            `,
            isCollapsed ? 'justify-center px-2' : 'px-5',
          )}
        >
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 font-extrabold tracking-tight"
            title="STARTER KIT"
          >
            <div className="
              flex size-8 shrink-0 items-center justify-center rounded-lg
              bg-primary text-primary-foreground shadow-xs
            "
            >
              <Layers className="size-4" />
            </div>
            {!isCollapsed && <span className="truncate text-base font-black">STARTER KIT</span>}
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-3">
          {renderNavLinks(isCollapsed)}
        </div>
      </aside>

      {/* Main Content Area (Right Side) */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="
          sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between
          border-b border-border bg-card/80 px-4 backdrop-blur-md
          sm:px-6
        "
        >
          <div className="flex items-center gap-3">
            {/* Mobile Sheet / Drawer Trigger */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger
                  render={(props) => (
                    <Button
                      {...props}
                      variant="ghost"
                      size="icon"
                      className="size-9"
                    >
                      <Menu className="size-5" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  )}
                />
                <SheetContent
                  side="left"
                  className="flex w-72 flex-col bg-card p-0"
                >
                  <div className="
                    flex h-16 shrink-0 items-center gap-3 border-b border-border
                    px-5
                  "
                  >
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="
                        flex items-center gap-2.5 font-extrabold tracking-tight
                      "
                    >
                      <div className="
                        flex size-8 items-center justify-center rounded-lg
                        bg-primary text-primary-foreground shadow-xs
                      "
                      >
                        <Layers className="size-4" />
                      </div>
                      <span className="text-base font-black">STARTER KIT</span>
                    </Link>
                  </div>
                  <div className="flex-1 overflow-y-auto py-3">
                    {renderNavLinks(false, () => setIsMobileMenuOpen(false))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Sidebar Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="
                hidden size-9 text-muted-foreground
                hover:text-foreground
                md:flex
              "
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed
                ? (
                  <PanelLeftOpen className="size-5" />
                )
                : (
                  <PanelLeftClose className="size-5" />
                )}
            </Button>

            {/* Current Page Title */}
            <h2 className="
              text-sm font-bold tracking-tight text-foreground
              sm:text-base
            "
            >
              {currentNav?.title || 'STARTER KIT'}
            </h2>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            <div className="
              hidden items-center gap-2
              sm:flex
            "
            >
              <LocaleSwitcher />
              <ThemeToggle />
              <NoticeBell />
            </div>
            <div className="sm:hidden">
              <NoticeBell />
            </div>
            <ProfileDropdown user={user} />
          </div>
        </header>

        {/* Password Change Banner if needed */}
        {user?.isPasswordChangeRequired && (
          <div className="
            border-b border-border bg-background/80 px-4 py-3
            sm:px-6
          "
          >
            <PasswordChangeBanner
              user={user}
              onChangeClick={() => setShowPasswordChangeModal(true)}
              onDeferred={handlePasswordDeferred}
            />
          </div>
        )}

        {/* Page Outlet */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <PasswordChangeModal
        user={user}
        open={showPasswordChangeModal}
        onOpenChange={setShowPasswordChangeModal}
        onPasswordChanged={handlePasswordChanged}
      />
    </div>
  );
}
