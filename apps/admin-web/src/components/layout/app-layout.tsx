import { useQueryClient } from '@tanstack/react-query';
import { type ToOptions, useLocation, useNavigate } from '@tanstack/react-router';
import { Bell, LogOut, Menu, PanelLeftClose, PanelLeftOpen, User, X } from 'lucide-react';
import type { IconName } from 'lucide-react/dynamic';
import { type ReactNode, useState } from 'react';

import { useAuthControllerLogoutV1 } from '#/.generated/api/endpoints/auth/auth';
import type { MeResponse } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { BrandLogo, LocaleSwitcher, ThemeToggle } from '#/components/app';
import { clearAuthState } from '#/store/auth';

import { LinkCard } from './link-card';

type NavigationItem = {
  title: string
  href: NonNullable<ToOptions['to']>
  icon: IconName
  iconColor: string
  permission?: string
};

type NavigationGroup = {
  title: string
  items: NavigationItem[]
};

export type AppLayoutProps = { user: MeResponse, children: ReactNode };

const navigationGroups: NavigationGroup[] = [
  {
    title: '서비스 관리',
    items: [
      { title: '고객 관리', href: '/customers', icon: 'user-check', iconColor: 'text-indigo-600 dark:text-indigo-400', permission: 'customer:read' },
    ],
  },
  {
    title: '관리자 관리',
    items: [
      { title: '관리자 관리', href: '/admin-management', icon: 'users', iconColor: 'text-blue-600 dark:text-blue-400', permission: 'user:read' },
      { title: '역할 관리', href: '/role-management', icon: 'shield-check', iconColor: 'text-amber-600 dark:text-amber-400', permission: 'role:read' },
      { title: '관리자 약관 관리', href: '/terms', icon: 'file-text', iconColor: 'text-violet-600 dark:text-violet-400', permission: 'terms:read' },
    ],
  },
  {
    title: '시스템 관리',
    items: [
      { title: '로그 관리', href: '/logs', icon: 'activity', iconColor: 'text-orange-600 dark:text-orange-400', permission: 'log:read' },
      { title: '시스템 설정', href: '/system-management', icon: 'settings-2', iconColor: 'text-cyan-600 dark:text-cyan-400', permission: 'system:read' },
    ],
  },
  {
    title: '개인',
    items: [
      { title: '프로필', href: '/profile', icon: 'user-round', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    ],
  },
];

function NavigationMenu({
  groups,
  activeHref,
  collapsed = false,
  onItemClick,
}: Readonly<{
  groups: NavigationGroup[]
  activeHref?: NavigationItem['href']
  collapsed?: boolean
  onItemClick?: () => void
}>) {
  return (
    <nav className="scroll-y grid content-start gap-4 p-3">
      {groups.map((group) => (
        <section key={group.title} className="grid gap-1">
          <h2 className={cn(`
            px-2 pb-1 text-xs font-bold tracking-wider text-muted-foreground
          `, collapsed && `invisible`)}
          >
            {group.title}
          </h2>
          {group.items.map((item) => (
            <LinkCard key={item.href} to={item.href} title={item.title} icon={item.icon} iconColor={item.iconColor} mini collapsed={collapsed} isActive={activeHref === item.href} onClick={onItemClick} />
          ))}
        </section>
      ))}
    </nav>
  );
}

export function AppLayout({ user, children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'alerts' | 'profile' | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const visibleNavigationGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.permission || user.permissions.includes(item.permission)),
    }))
    .filter((group) => group.items.length > 0);
  const visibleNavigation = visibleNavigationGroups.flatMap((group) => group.items);
  const logoutMutation = useAuthControllerLogoutV1();
  const activeItem = visibleNavigation
    .filter((item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0];

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync({ data: {} });
    }
    finally {
      clearAuthState();
      await navigate({ to: '/login', replace: true });
      queryClient.clear();
    }
  };

  const openProfile = () => {
    setOpenMenu(null);
    void navigate({ to: '/profile' });
  };

  return (
    <div className="flex size-full">
      {isMobileOpen && (
        <button
          type="button"
          className="
            fixed inset-0 z-40 bg-black/40
            md:hidden
          "
          aria-label="메뉴 닫기"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <aside className={cn(`
        hidden border-r transition-all duration-300
        md:grid md:grid-rows-[auto_1fr]
      `, isCollapsed
        ? `w-18`
        : `w-64`)}
      >
        <div className="flex h-16 items-center border-b px-5"><BrandLogo /></div>
        <NavigationMenu groups={visibleNavigationGroups} activeHref={activeItem?.href} collapsed={isCollapsed} />
      </aside>
      <aside
        className={cn(
          `
            fixed inset-y-0 left-0 z-50 grid w-72 grid-rows-[auto_1fr] border-r
            bg-background shadow-xl transition-transform duration-300
            md:hidden
          `,
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <BrandLogo />
          <Button type="button" variant="ghost" size="icon" aria-label="메뉴 닫기" onClick={() => setIsMobileOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>
        <NavigationMenu groups={visibleNavigationGroups} activeHref={activeItem?.href} onItemClick={() => setIsMobileOpen(false)} />
      </aside>

      <div className="grid min-w-0 flex-1 grid-rows-[auto_1fr]">
        <header className="
          flex min-h-16 flex-wrap items-center justify-between gap-2 border-b
          px-4 py-2
        "
        >
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="메뉴 열기"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="
                hidden
                md:flex
              "
              aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
              onClick={() => setIsCollapsed((current) => !current)}
            >
              {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
            <h2 className="truncate text-base font-bold tracking-tight">{activeItem?.title ?? '관리자'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <div className="relative">
              <Button type="button" variant="outline" size="icon" aria-label="알림" onClick={() => setOpenMenu((current) => current === 'alerts' ? null : 'alerts')}>
                <Bell className="size-4" />
              </Button>
              {openMenu === 'alerts' && (
                <div className="
                  absolute right-0 z-50 mt-2 w-64 rounded-md border bg-popover
                  p-4 text-sm text-muted-foreground shadow-md
                "
                >
                  새로운 알림이 없습니다.
                </div>
              )}
            </div>
            <ThemeToggle />
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                className="flex h-10 items-center gap-2 rounded-full px-2"
                aria-label="프로필 메뉴"
                onClick={() => setOpenMenu((current) => current === 'profile' ? null : 'profile')}
              >
                <span className="
                  flex size-8 items-center justify-center rounded-full
                  bg-primary/10 text-primary
                "
                >
                  <User className="size-4" />
                </span>
                <span className="
                  hidden text-left
                  md:block
                "
                >
                  <span className="block text-xs font-semibold">{user.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {user.email}
                  </span>
                </span>
              </Button>
              {openMenu === 'profile' && (
                <div className="
                  absolute right-0 z-50 mt-2 w-56 rounded-md border bg-popover
                  p-2 text-popover-foreground shadow-md
                "
                >
                  <div className="border-b px-2 pb-2">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.roleLabel}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-1 w-full justify-start text-sm"
                    onClick={openProfile}
                  >
                    <User className="mr-2 size-4" />
                    프로필
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="
                      w-full justify-start text-sm text-destructive
                      hover:text-destructive
                    "
                    disabled={logoutMutation.isPending}
                    onClick={() => void logout()}
                  >
                    <LogOut className="mr-2 size-4" />
                    로그아웃
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="scroll-y min-w-0">{children}</main>
      </div>
    </div>
  );
}
