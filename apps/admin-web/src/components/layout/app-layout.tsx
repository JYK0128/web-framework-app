import { useQueryClient } from '@tanstack/react-query';
import { type ToOptions, useLocation, useNavigate } from '@tanstack/react-router';
import { Bell, Check, Globe, LogOut, Menu, PanelLeftClose, PanelLeftOpen, User, X } from 'lucide-react';
import type { IconName } from 'lucide-react/dynamic';
import { type ReactNode, useState } from 'react';

import { useAuthControllerLogoutV1 } from '#/.generated/api/endpoints/auth/auth';
import type { MeResponse } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { BrandLogo, ThemeToggle } from '#/components/app';

import { LinkCard } from './link-card';

type NavigationItem = {
  title: string
  href: NonNullable<ToOptions['to']>
  icon: IconName
  iconColor: string
};

export type AppLayoutProps = { user: MeResponse, children: ReactNode };

const navigation: NavigationItem[] = [
  { title: '프로필', href: '/profile', icon: 'user-round', iconColor: 'text-emerald-600 dark:text-emerald-400' },
];

export function AppLayout({ user, children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'locale' | 'alerts' | 'profile' | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutMutation = useAuthControllerLogoutV1();
  const activeItem = navigation
    .filter((item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0];

  const logout = async () => {
    await logoutMutation.mutateAsync({ data: {} });
    queryClient.clear();
    await navigate({ to: '/login', replace: true });
  };

  const selectLocale = (locale: 'ko' | 'en') => {
    document.documentElement.lang = locale;
    localStorage.setItem('admin-locale', locale);
    setOpenMenu(null);
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
        <nav className="scroll-y grid content-start gap-1 p-3">
          <div className={cn(`
            px-2 pb-2 text-xs font-bold tracking-wider text-muted-foreground
          `, isCollapsed && `invisible`)}
          >
            관리자
          </div>
          {navigation.map((item) => (
            <LinkCard key={item.href} to={item.href} title={item.title} icon={item.icon} iconColor={item.iconColor} mini collapsed={isCollapsed} isActive={activeItem?.href === item.href} />
          ))}
        </nav>
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
        <nav className="scroll-y grid content-start gap-1 p-3">
          <div className="
            px-2 pb-2 text-xs font-bold tracking-wider text-muted-foreground
          "
          >
            관리자
          </div>
          {navigation.map((item) => (
            <LinkCard key={item.href} to={item.href} title={item.title} icon={item.icon} iconColor={item.iconColor} mini isActive={activeItem?.href === item.href} onClick={() => setIsMobileOpen(false)} />
          ))}
        </nav>
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
            <div className="relative">
              <Button type="button" variant="outline" size="icon" aria-label="언어 선택" onClick={() => setOpenMenu((current) => current === 'locale' ? null : 'locale')}>
                <Globe className="size-4" />
              </Button>
              {openMenu === 'locale' && (
                <div className="
                  absolute right-0 z-50 mt-2 grid min-w-32 gap-1 rounded-md
                  border bg-popover p-1 text-popover-foreground shadow-md
                "
                >
                  <button
                    type="button"
                    className="
                      flex items-center justify-between rounded-sm px-3 py-2
                      text-left text-sm
                      hover:bg-accent
                    "
                    onClick={() => selectLocale('ko')}
                  >
                    한국어
                    <Check className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="
                      rounded-sm px-3 py-2 text-left text-sm
                      text-muted-foreground
                      hover:bg-accent
                    "
                    onClick={() => selectLocale('en')}
                  >
                    English
                  </button>
                </div>
              )}
            </div>
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
                      {user.roleCode}
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
