import { BrandLogo, LocaleSwitcher, Navigation, type NavigationItem, ProfileDropdown } from '@pkg/web-core/application';
import { useI18n } from '@pkg/web-core/i18n';
import { AppLayout as AppLayoutParts } from '@pkg/web-core/template';
import { Button, buttonVariants, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, ThemeToggle } from '@pkg/web-core/ui';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, Outlet, useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { Globe, LogIn, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { useAuthControllerLogoutV1 } from '#/.generated/api/endpoints/auth/auth';
import type { MeResponse } from '#/.generated/api/model';

import { ServiceNotifications } from './-components/service-notifications';

const navigation = [
  { label: 'service.navigation.home', to: '/' as const },
  { label: 'service.navigation.support', to: '/support' as const },
  { label: 'service.navigation.notices', to: '/notices' as const },
  { label: 'service.navigation.events', to: '/events' as const },
  { label: 'service.navigation.qna', to: '/qna' as const },
  { label: 'service.navigation.faq', to: '/faq' as const },
];

function ServiceAppLayout({ children, user }: { children: ReactNode, user: MeResponse | null }) {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutMutation = useAuthControllerLogoutV1();
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const navigationContainerRef = useRef<HTMLDivElement>(null);
  const navigationTriggerRef = useRef<HTMLButtonElement>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const navigationItems: NavigationItem[] = navigation.map((item) => ({
    id: item.to,
    label: t(item.label),
    to: item.to,
    active: location.pathname === item.to
      || (item.to !== '/' && location.pathname.startsWith(`${item.to}/`)),
  }));

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
    <AppLayoutParts.Root className="flex-col">
      <AppLayoutParts.Main>
        <AppLayoutParts.Header className="
          relative z-50 shrink-0 bg-background/95 backdrop-blur-sm
        "
        >
          <div
            className="
              mx-auto flex h-16 w-full max-w-6xl items-center justify-between
              relative gap-4 px-4
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
            <BrandLogo />
            <Navigation
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
              {user && <ServiceNotifications userId={user.id} />}
              {user
                ? (
                  <ProfileDropdown
                    user={user}
                    logoutPending={logoutMutation.isPending}
                    onProfile={() => void navigate({ to: '/profile' })}
                    onLogout={() => void logout()}
                  />
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
                      className="lg:hidden"
                      aria-label={t('localeSwitcher.language')}
                    >
                      <Globe className="size-4" />
                    </Button>
                  )}
                />
                <DropdownMenuContent
                  align="end"
                  className="
                    w-56
                    lg:hidden
                  "
                >
                  <LocaleSwitcher presentation="submenu" />
                  <DropdownMenuItem onClick={() => setTheme(isDark ? 'light' : 'dark')}>
                    {isDark ? <Sun /> : <Moon />}
                    {t(isDark ? 'app.theme.switchToLight' : 'app.theme.switchToDark')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </AppLayoutParts.Header>
        <AppLayoutParts.Content className="flex-1">{children}</AppLayoutParts.Content>
      </AppLayoutParts.Main>
    </AppLayoutParts.Root>
  );
}

export const Route = createFileRoute('/_app')({ component: AppLayoutRoute });

function AppLayoutRoute() {
  const { user } = Route.useRouteContext();
  return (
    <ServiceAppLayout user={user}>
      <Outlet />
    </ServiceAppLayout>
  );
}
