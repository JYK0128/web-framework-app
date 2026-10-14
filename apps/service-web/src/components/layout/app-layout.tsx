import { useI18n } from '@pkg/web-core/i18n';
import { Navi, ThemeToggle, type NaviItem } from '@pkg/web-core/ui';
import { cn } from '@pkg/web-core/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { Bell, CalendarDays, Check, CircleHelp, Globe, Home, LogIn, LogOut, Megaphone, Menu, MessageCircle, MessageCircleQuestion, Moon, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { useAuthControllerLogoutV1 } from '#/.generated/api/endpoints/auth/auth';
import type { MeResponse } from '#/.generated/api/model';
import { Button, buttonVariants, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';
import { BrandLogo, LocaleSwitcher } from '#/components/app';
import { useSSE } from '#/hooks/use-sse';
import { type AppLocale, locales } from '#/i18n/i18n';
import { isSupportChatOpen } from '#/lib/support-chat-state';

const navigation = [
  { label: 'service.navigation.home', to: '/' as const, icon: <Home /> },
  { label: 'service.navigation.support', to: '/support' as const, icon: <MessageCircle /> },
  { label: 'service.navigation.notices', to: '/notices' as const, icon: <Megaphone /> },
  { label: 'service.navigation.events', to: '/events' as const, icon: <CalendarDays /> },
  { label: 'service.navigation.qna', to: '/qna' as const, icon: <MessageCircleQuestion /> },
  { label: 'service.navigation.faq', to: '/faq' as const, icon: <CircleHelp /> },
];

type UserNotification = {
  id: string
  kind: 'support.reply'
  roomId: string
  message: string
  createdAt: string
} | {
  id: string
  kind: 'qna.answer'
  qnaId: string
  questionTitle: string
  message: string
  createdAt: string
};

export function AppLayout({ children, user }: { children: ReactNode, user: MeResponse | null }) {
  const { i18n, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutMutation = useAuthControllerLogoutV1();
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const navigationContainerRef = useRef<HTMLDivElement>(null);
  const navigationTriggerRef = useRef<HTMLButtonElement>(null);
  const [notificationState, setNotificationState] = useState<{ userId: string | null, items: UserNotification[] }>({ userId: user?.id ?? null, items: [] });
  const currentUserId = user?.id ?? null;
  const notifications = notificationState.userId === currentUserId ? notificationState.items : [];
  useEffect(() => {
    if (!isNavigationOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !navigationContainerRef.current?.contains(event.target)) {
        setIsNavigationOpen(false);
      }
    };
    window.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => window.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [isNavigationOpen]);

  const navigationItems: NaviItem[] = navigation.map((item) => ({
    id: item.to,
    label: t(item.label),
    to: item.to,
    icon: item.icon,
    active: location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(`${item.to}/`)),
  }));
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const currentLocale = i18n.language;
  const hasLocalePath
    = location.pathname === '/'
      || locales.some(({ code }) => location.pathname === `/${code}` || location.pathname === `/${code}/`);

  useSSE<UserNotification>({
    url: user ? '/api/v1/notifications/events' : null,
    onEvent: (event) => {
      if (event.type !== 'notification.created') return;
      if (event.data.kind === 'support.reply' && isSupportChatOpen(event.data.roomId)) return;
      if (!currentUserId) return;
      setNotificationState((current) => ({
        userId: currentUserId,
        items: [event.data, ...(current.userId === currentUserId ? current.items : []).filter(({ id }) => id !== event.data.id)].slice(0, 10),
      }));
    },
  });

  const changeLocale = (nextLocale: AppLocale) => {
    if (nextLocale === currentLocale) return;

    void i18n.changeLanguage(nextLocale).then(() => {
      if (!hasLocalePath) return;

      const hash = location.hash ? `#${location.hash}` : '';
      void navigate({ href: `/${nextLocale}${location.searchStr}${hash}`, replace: true });
    });
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync({ data: {} });
    }
    finally {
      queryClient.clear();
      await navigate({ to: '/', replace: true });
      await router.invalidate();
    }
  };

  return (
    <div className="flex size-full flex-col">
      <header className="shrink-0 border-b bg-background/95 backdrop-blur-sm">
        <div className="
          mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4
          relative px-4
          md:px-6
        "
          ref={navigationContainerRef}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && isNavigationOpen) {
              setIsNavigationOpen(false);
              navigationTriggerRef.current?.focus();
            }
          }}
        >
          <BrandLogo labelClassName="hidden sm:inline" />
          <Navi
            items={navigationItems}
            variant={{ base: 'side', lg: 'bar' }}
            sideOpen={isNavigationOpen}
            sideId="service-navigation-side"
            label={t('service.navigation.menu')}
            onNavigate={() => setIsNavigationOpen(false)}
            sideClassName="absolute left-0 right-0 top-full z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b bg-background p-4 shadow-lg lg:hidden"
          />
          <div className="flex items-center gap-2">
            <div className="
              hidden items-center gap-2
              lg:flex
            "
            >
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={(props) => (
                    <Button
                      {...props}
                      type="button"
                      variant="outline"
                      size="icon"
                      className="
                        relative hidden
                        lg:inline-flex
                      "
                      aria-label={t('app.alertBell.openAlerts')}
                    >
                      <Bell className="size-4" />
                      {notifications.length > 0 && (
                        <span className="
                          absolute -right-1 -top-1 flex size-4 items-center
                          justify-center rounded-full bg-destructive text-[10px]
                          text-destructive-foreground
                        "
                        >
                          {Math.min(notifications.length, 9)}
                        </span>
                      )}
                    </Button>
                  )}
                />
                <DropdownMenuContent align="end" className="w-64">
                  {notifications.length === 0
                    ? <p className="p-4 text-sm text-muted-foreground">{t('app.alertBell.noAlerts')}</p>
                    : notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="
                          flex h-auto cursor-pointer flex-col items-start gap-1
                          whitespace-normal px-4 py-3
                        "
                        onClick={() => void navigate({ to: notification.kind === 'support.reply' ? '/support' : '/qna' })}
                      >
                        <p className="text-sm font-medium">
                          {t(notification.kind === 'support.reply' ? 'app.alertBell.supportReply' : 'app.alertBell.qnaAnswer')}
                        </p>
                        {notification.kind === 'qna.answer' && (
                          <p className="text-sm text-muted-foreground">
                            {notification.questionTitle}
                          </p>
                        )}
                        <p className="
                          mt-1 line-clamp-3 text-sm text-muted-foreground
                        "
                        >
                          {notification.message}
                        </p>
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {user
              ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={(props) => (
                      <Button
                        {...props}
                        type="button"
                        variant="ghost"
                        className="
                          h-10 gap-2 rounded-full px-1
                          sm:px-2
                        "
                        aria-label={t('app.profileDropdown.open')}
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
                          <span className="
                            block text-[11px] text-muted-foreground
                          "
                          >
                            {user.email}
                          </span>
                        </span>
                      </Button>
                    )}
                  />
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>
                        <span className="
                          block text-sm font-semibold text-foreground
                        "
                        >
                          {user.name}
                        </span>
                        <span className="block">{user.roleLabel}</span>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem render={<Link to="/profile" />}>
                        <User />
                        {t('app.profileDropdown.profile')}
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" disabled={logoutMutation.isPending} onClick={() => void logout()}>
                        <LogOut />
                        {t(logoutMutation.isPending ? 'app.profileDropdown.loggingOut' : 'app.profileDropdown.logout')}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
              : (
                <Link
                  className={buttonVariants({ variant: 'outline', size: 'icon' })}
                  to="/login"
                  search={{ callback: `${location.pathname}${location.searchStr}${location.hash}` }}
                  aria-label={t('service.navigation.login')}
                  title={t('service.navigation.login')}
                >
                  <LogIn className="size-4" />
                </Link>
              )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-label={t('service.navigation.openMenu')}
              aria-expanded={isNavigationOpen}
              aria-controls="service-navigation-side"
              ref={navigationTriggerRef}
              onClick={() => setIsNavigationOpen((open) => !open)}
            >
              <Menu className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(props) => (
                  <Button
                    {...props}
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={t('app.localeSwitcher.language')}
                    className="lg:hidden"
                  >
                    <Globe className="size-4" />
                  </Button>
                )}
              />
              <DropdownMenuContent align="end" className="w-56 lg:hidden">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Globe />
                    {t('app.localeSwitcher.language')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {locales.map((locale) => (
                      <DropdownMenuItem key={locale.code} onClick={() => changeLocale(locale.code)}>
                        {locale.label}
                        {currentLocale === locale.code && (
                          <Check className="ml-auto" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={() => setTheme(isDark ? 'light' : 'dark')}>
                  {isDark ? <Sun /> : <Moon />}
                  {t(isDark ? 'app.theme.switchToLight' : 'app.theme.switchToDark')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="min-h-0 flex-1 scroll-y">{children}</main>
    </div>
  );
}
