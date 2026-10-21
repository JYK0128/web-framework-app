import { AppIcon, BrandLogo, LocaleSwitcher, ProfileDropdown } from '@pkg/web-core/application';
import { useI18n } from '@pkg/web-core/context/i18n';
import { useSSE } from '@pkg/web-core/hooks';
import { AppLayout as AppLayoutParts, LinkCard } from '@pkg/web-core/template';
import { ThemeToggle } from '@pkg/web-core/ui';
import { cn } from '@pkg/web-core/utils';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Outlet, type ToOptions, useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { Bell, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import type { IconName } from 'lucide-react/dynamic';
import { type ReactNode, useState } from 'react';

import { useAuthControllerLogoutV1 } from '~/.generated/api/endpoints/auth/auth';
import type { MeResponse } from '~/.generated/api/model';
import { Button } from '~/.generated/shadcn/components/ui';
import { isSupportChatOpen } from '~/hooks/use-support-socket';

type AdminAlert = {
  kind: 'support.unanswered'
  roomId: string
  elapsedMinutes: number
  createdAt: string
} | {
  kind: 'qna.created'
  qnaId: string
  title: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  createdAt: string
};

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

type AppLayoutProps = { user: MeResponse, children: ReactNode };

const navigationGroups: NavigationGroup[] = [
  {
    title: 'admin.navigation.overview',
    items: [
      { title: 'admin.navigation.dashboard', href: '/', icon: 'layout-dashboard', iconColor: 'text-blue-600 dark:text-blue-400' },
    ],
  },
  {
    title: 'admin.navigation.serviceManagement',
    items: [
      { title: 'admin.navigation.customers', href: '/customers', icon: 'user-check', iconColor: 'text-indigo-600 dark:text-indigo-400', permission: 'customer:read' },
      { title: 'admin.navigation.memberships', href: '/memberships', icon: 'crown', iconColor: 'text-purple-600 dark:text-purple-400', permission: 'customer:read' },
      { title: 'admin.navigation.faqs', href: '/faqs', icon: 'circle-help', iconColor: 'text-teal-600 dark:text-teal-400', permission: 'faq:read' },
      { title: 'admin.navigation.qna', href: '/qna', icon: 'message-circle-question', iconColor: 'text-cyan-600 dark:text-cyan-400', permission: 'qna:read' },
      { title: 'admin.navigation.support', href: '/support', icon: 'messages-square', iconColor: 'text-sky-600 dark:text-sky-400', permission: 'support:read' },
      { title: 'admin.navigation.serviceTerms', href: '/service-terms', icon: 'file-signature', iconColor: 'text-violet-600 dark:text-violet-400', permission: 'service_term:read' },
    ],
  },
  {
    title: 'admin.navigation.contentManagement',
    items: [
      { title: 'admin.navigation.notices', href: '/notices', icon: 'megaphone', iconColor: 'text-rose-600 dark:text-rose-400', permission: 'notice:read' },
      { title: 'admin.navigation.events', href: '/events', icon: 'calendar-days', iconColor: 'text-fuchsia-600 dark:text-fuchsia-400', permission: 'event:read' },
    ],
  },
  {
    title: 'admin.navigation.operatorManagement',
    items: [
      { title: 'admin.navigation.roles', href: '/roles', icon: 'shield-check', iconColor: 'text-amber-600 dark:text-amber-400', permission: 'role:read' },
      { title: 'admin.navigation.operators', href: '/operators', icon: 'users', iconColor: 'text-blue-600 dark:text-blue-400', permission: 'operator:read' },
      { title: 'admin.navigation.terms', href: '/terms', icon: 'file-text', iconColor: 'text-violet-600 dark:text-violet-400', permission: 'terms:read' },
    ],
  },
  {
    title: 'admin.navigation.systemManagement',
    items: [
      { title: 'admin.navigation.logs', href: '/logs', icon: 'activity', iconColor: 'text-orange-600 dark:text-orange-400', permission: 'log:read' },
      { title: 'admin.navigation.serviceSettings', href: '/service-settings', icon: 'settings-2', iconColor: 'text-cyan-600 dark:text-cyan-400', permission: 'system:read' },
      { title: 'admin.navigation.systemSettings', href: '/system-settings', icon: 'server-cog', iconColor: 'text-violet-600 dark:text-violet-400', permission: 'system:read' },
    ],
  },
  {
    title: 'admin.navigation.personal',
    items: [
      { title: 'admin.navigation.profile', href: '/profile', icon: 'user-round', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    ],
  },
];

function NavigationMenu({
  groups,
  activeHref,
  collapsed = false,
  onItemClick,
  label,
}: Readonly<{
  groups: NavigationGroup[]
  activeHref?: NavigationItem['href']
  collapsed?: boolean
  onItemClick?: () => void
  label: string
}>) {
  return (
    <nav aria-label={label} className="scroll-y grid content-start gap-4 p-3">
      {groups.map((group) => (
        <section key={group.title} className="grid gap-1">
          <h2 className={cn(`
            px-2 pb-1 text-xs font-bold tracking-wider text-muted-foreground
          `, collapsed && `invisible`)}
          >
            {group.title}
          </h2>
          {group.items.map((item) => (
            <LinkCard key={item.href} to={item.href} title={item.title} icon={<AppIcon name={item.icon} />} iconColor={item.iconColor} mini collapsed={collapsed} isActive={activeHref === item.href} onClick={onItemClick} />
          ))}
        </section>
      ))}
    </nav>
  );
}

function AdminAppLayout({ user, children }: AppLayoutProps) {
  const { t } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'alerts' | 'profile' | null>(null);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const visibleNavigationGroups = navigationGroups
    .map((group) => ({
      ...group,
      title: t(group.title),
      items: group.items
        .filter((item) => !item.permission || user.permissions.includes(item.permission))
        .map((item) => ({ ...item, title: t(item.title) })),
    }))
    .filter((group) => group.items.length > 0);
  const visibleNavigation = visibleNavigationGroups.flatMap((group) => group.items);
  const logoutMutation = useAuthControllerLogoutV1();
  const activeItem = visibleNavigation
    .filter((item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0];

  useSSE<Omit<AdminAlert & { kind: 'support.unanswered' }, 'kind'>>({
    url: user.permissions.includes('support:read') ? '/api/v1/support/notifications/events' : null,
    onEvent: (event) => {
      if (event.type === 'support.unanswered' && !isSupportChatOpen(event.data.roomId)) {
        const alert: AdminAlert = { ...event.data, kind: 'support.unanswered' };
        setAlerts((current) => [alert, ...current].slice(0, 10));
      }
    },
  });

  useSSE<Omit<AdminAlert & { kind: 'qna.created' }, 'kind'>>({
    url: user.permissions.includes('qna:read') ? '/api/v1/qna/notifications/events' : null,
    onEvent: (event) => {
      if (event.type === 'qna.created') {
        const alert: AdminAlert = { ...event.data, kind: 'qna.created' };
        setAlerts((current) => [alert, ...current].slice(0, 10));
      }
    },
  });

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync({ data: {} });
    }
    finally {
      queryClient.clear();
      await navigate({ to: '/login', replace: true });
      await router.invalidate();
    }
  };

  return (
    <AppLayoutParts.Root>
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
      <AppLayoutParts.Sidebar className={cn(`
        hidden border-r transition-all duration-300
        md:grid md:grid-rows-[auto_1fr]
      `, isCollapsed
        ? `w-18`
        : `w-64`)}
      >
        <div className="flex h-16 items-center border-b px-5"><BrandLogo text="SERVICE FACTORY" /></div>
        <NavigationMenu groups={visibleNavigationGroups} activeHref={activeItem?.href} collapsed={isCollapsed} label={t('admin.navigation.menu')} />
      </AppLayoutParts.Sidebar>
      <AppLayoutParts.Sidebar
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
          <BrandLogo text="SERVICE FACTORY" />
          <Button type="button" variant="ghost" size="icon" aria-label="메뉴 닫기" onClick={() => setIsMobileOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>
        <NavigationMenu groups={visibleNavigationGroups} activeHref={activeItem?.href} onItemClick={() => setIsMobileOpen(false)} label={t('admin.navigation.menu')} />
      </AppLayoutParts.Sidebar>

      <AppLayoutParts.Main>
        <AppLayoutParts.Header className="
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
            <h2 className="truncate text-base font-bold tracking-tight">{activeItem?.title ?? 'Service-Factory Admin'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <div className="relative">
              <Button type="button" variant="outline" size="icon" aria-label="알림" onClick={() => setOpenMenu((current) => current === 'alerts' ? null : 'alerts')}>
                <Bell className="size-4" />
                {alerts.length > 0 && (
                  <span className="
                    absolute -mt-7 ml-7 flex size-4 items-center justify-center
                    rounded-full bg-destructive text-[10px]
                    text-destructive-foreground
                  "
                  >
                    {Math.min(alerts.length, 9)}
                  </span>
                )}
              </Button>
              {openMenu === 'alerts' && (
                <div className="
                  absolute right-0 z-50 mt-2 w-64 rounded-md border bg-popover
                  p-4 text-sm text-muted-foreground shadow-md
                "
                >
                  {alerts.length === 0
                    ? '새로운 알림이 없습니다.'
                    : (
                      <div className="grid gap-2">
                        {alerts.map((alert) => (
                          <button
                            key={alert.kind === 'support.unanswered' ? `${alert.roomId}:${alert.createdAt}` : alert.qnaId}
                            type="button"
                            className="
                              text-left text-foreground
                              hover:underline
                            "
                            onClick={() => {
                              setOpenMenu(null);
                              void navigate({ to: alert.kind === 'support.unanswered' ? '/support' : '/qna' });
                            }}
                          >
                            {alert.kind === 'support.unanswered'
                              ? (
                                <>
                                  미응답 문의 ·
                                  {' '}
                                  {alert.elapsedMinutes}
                                  분 경과
                                </>
                              )
                              : (
                                <>
                                  새 Q&A 문의 ·
                                  {' '}
                                  {alert.title}
                                </>
                              )}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
            <ThemeToggle />
            <ProfileDropdown
              user={user}
              open={openMenu === 'profile'}
              logoutPending={logoutMutation.isPending}
              onOpenChange={(open) => setOpenMenu(open ? 'profile' : null)}
              onProfile={() => {
                setOpenMenu(null);
                void navigate({ to: '/profile' });
              }}
              onLogout={() => {
                setOpenMenu(null);
                void logout();
              }}
            />
          </div>
        </AppLayoutParts.Header>
        <AppLayoutParts.Content>{children}</AppLayoutParts.Content>
      </AppLayoutParts.Main>
    </AppLayoutParts.Root>
  );
}

export const Route = createFileRoute('/_protected/_app')({ component: ProtectedAppLayout });

function ProtectedAppLayout() {
  const { user } = Route.useRouteContext();
  return <AdminAppLayout user={user}><Outlet /></AdminAppLayout>;
}
