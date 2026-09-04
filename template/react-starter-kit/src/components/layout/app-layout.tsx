import { type ToOptions, useLocation } from '@tanstack/react-router';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { IconName } from 'lucide-react/dynamic';
import { type ReactNode, useState } from 'react';

import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { AlertBell, BrandLogo, LocaleSwitcher, ProfileDropdown, ThemeToggle } from '#/components/app';
import type { ProfileDropdownUser } from '#/components/app/profile-dropdown';
import { LinkCard } from '#/components/layout';
import { hasPermission, type PermissionName, type RolePermissions } from '#/core/auth/permissions';
import { useI18n } from '#/hooks';

interface NavigationItem {
  title: string
  href: NonNullable<ToOptions['to']>
  icon: IconName
  iconColor?: string
  permission?: PermissionName
}

interface NavigationGroup {
  title: string
  items: NavigationItem[]
}

export type AppLayoutProps = {
  user?: ProfileDropdownUser & { permissions?: RolePermissions }
  children: ReactNode
};

export function AppLayout({ user, children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { t } = useI18n();

  const navGroups: NavigationGroup[] = [
    {
      title: t('layout.navigation.groupService'),
      items: [
        {
          title: t('layout.navigation.dashboard'),
          href: '/dashboard',
          icon: 'layout-dashboard',
          iconColor: 'text-slate-600 dark:text-slate-400',
          permission: undefined,
        },
        {
          title: t('layout.navigation.announcements'),
          href: '/notice',
          icon: 'megaphone',
          iconColor: 'text-blue-600 dark:text-blue-400',
          permission: undefined,
        },
        {
          title: t('layout.navigation.faq'),
          href: '/faq',
          icon: 'circle-help',
          iconColor: 'text-teal-600 dark:text-teal-400',
          permission: undefined,
        },
        {
          title: t('layout.navigation.inquiries'),
          href: '/inquiry',
          icon: 'message-circle-question',
          iconColor: 'text-indigo-600 dark:text-indigo-400',
          permission: undefined,
        },
        {
          title: t('layout.navigation.profile'),
          href: '/profile',
          icon: 'user-round',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          permission: undefined,
        },
      ],
    },
    {
      title: t('layout.navigation.groupOperations'),
      items: [
        {
          title: t('layout.navigation.users'),
          href: '/user-management',
          icon: 'users',
          iconColor: 'text-blue-600 dark:text-blue-400',
          permission: 'user:manage',
        },
        {
          title: t('layout.navigation.permissions'),
          href: '/permission-management',
          icon: 'key-round',
          iconColor: 'text-amber-600 dark:text-amber-400',
          permission: 'role:manage',
        },
        {
          title: t('layout.navigation.notices'),
          href: '/notice-management',
          icon: 'megaphone',
          iconColor: 'text-cyan-600 dark:text-cyan-400',
          permission: 'notice:manage',
        },
        {
          title: t('layout.navigation.faqs'),
          href: '/faq-management',
          icon: 'message-square-quote',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          permission: 'faq:manage',
        },
        {
          title: t('layout.navigation.inquiryManagement'),
          href: '/inquiry-management',
          icon: 'message-circle-question',
          iconColor: 'text-pink-600 dark:text-pink-400',
          permission: 'inquiry:manage',
        },
        {
          title: t('layout.navigation.terms'),
          href: '/terms-management',
          icon: 'file-text',
          iconColor: 'text-violet-600 dark:text-violet-400',
          permission: 'term:manage',
        },
        {
          title: t('layout.navigation.activityLogs'),
          href: '/log-management',
          icon: 'activity',
          iconColor: 'text-orange-600 dark:text-orange-400',
          permission: 'activityLog:manage',
        },
        {
          title: t('layout.navigation.systemConfig'),
          href: '/system-management',
          icon: 'settings-2',
          iconColor: 'text-slate-600 dark:text-slate-400',
          permission: 'system:manage',
        },
        {
          title: t('layout.navigation.messageTemplates'),
          href: '/message-management',
          icon: 'mail-check',
          iconColor: 'text-rose-600 dark:text-rose-400',
          permission: 'template:manage',
        },
      ],
    },
  ];

  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.permission === undefined || hasPermission(user?.permissions, item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);

  const activeNavItem = visibleNavGroups
    .flatMap((group) => group.items)
    .filter((item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0];

  const renderNavLinks = (collapsed = false, onItemClick?: () => void) => (
    <nav className="grid gap-4">
      {visibleNavGroups.map((group) => (
        <div
          key={group.title}
          className="grid w-full gap-1"
        >
          <div
            className={cn(
              'text-xs font-bold tracking-wider text-muted-foreground',
              collapsed && 'invisible',
            )}
          >
            {group.title}
          </div>
          {group.items.map((item) => {
            const isActive = activeNavItem?.href === item.href;
            return (
              <LinkCard
                key={item.href}
                to={item.href}
                title={item.title}
                icon={item.icon}
                iconColor={item.iconColor}
                mini
                collapsed={collapsed}
                isActive={isActive}
                onClick={onItemClick}
              />
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex size-full">
      {/* Desktop Left Sidebar (hidden on mobile, visible on md and up) */}
      <aside
        className={cn(
          `
            hidden
            md:grid
            grid-rows-[auto_1fr] border-r
          `,
          'transition-all duration-300',
          isCollapsed ? 'w-18' : 'w-64',
        )}
      >
        {/* Brand Logo & Title */}
        <div className="flex h-16 border-b px-5">
          <BrandLogo collapsed={isCollapsed} />
        </div>

        {/* Sidebar Navigation */}
        <div className="scroll-y">
          {renderNavLinks(isCollapsed)}
        </div>
      </aside>

      {/* Main Content Area (Right Side) */}
      <div className="grid flex-1 grid-rows-[auto_1fr]">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between border-b px-4">
          {/* Menu Folding Controls & Branding */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Sheet Menu (visible on mobile, hidden on md and up) */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger
                render={(
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label={t('layout.navigation.menu')}
                  />
                )}
              >
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="h-16 border-b px-5 justify-center">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <BrandLogo onClick={() => setIsMobileOpen(false)} />
                </SheetHeader>
                <div className="scroll-y p-3">
                  {renderNavLinks(false, () => setIsMobileOpen(false))}
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Sidebar Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="
                hidden
                md:flex
              "
              onClick={() => setIsCollapsed((prev) => !prev)}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>

            {/* Current Page Title */}
            <h2 className="
              truncate text-base font-bold tracking-tight text-foreground
            "
            >
              {activeNavItem?.title}
            </h2>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
            <AlertBell />
            <ProfileDropdown user={user} />
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
