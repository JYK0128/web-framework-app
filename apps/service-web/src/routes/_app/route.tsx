import { ServicePermission } from '@pkg/shared';
import { useI18n, usePermissions } from '@pkg/web-core/context';
import { AppLayout as AppLayoutParts, BrandLogo, Button, buttonVariants, LocaleSwitcher, Navigation, type NavigationItem, ProfileDropdown, ThemeToggle } from '@pkg/web-core/ui';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, Outlet, useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { LogIn, Menu } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { useAuthControllerLogoutV1 } from '~/.generated/api/endpoints/auth/auth';
import type { MeResponse } from '~/.generated/api/model';
import { browserEnv } from '~/lib/browser-env';

import { ServiceNotifications } from './-components/service-notifications';

const adminWebUrl = browserEnv.adminWebUrl;

const navigation = [
  { label: 'service.navigation.home', to: '/' as const },
  { label: 'service.navigation.events', to: '/events' as const },
  { label: 'service.navigation.notices', to: '/notices' as const },
  { label: 'service.navigation.faq', to: '/faq' as const },
  { label: 'service.navigation.qna', to: '/qna' as const },
  { label: 'service.navigation.support', to: '/support' as const, permission: ServicePermission.support.read.code },
  { label: 'service.navigation.admin', externalHref: adminWebUrl, roleCode: 'super_user' },
];

function ServiceAppLayout({ children, user }: { children: ReactNode, user: MeResponse | null }) {
  const { t } = useI18n();
  const permissions = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutMutation = useAuthControllerLogoutV1();
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const navigationContainerRef = useRef<HTMLDivElement>(null);
  const navigationTriggerRef = useRef<HTMLButtonElement>(null);
  const navigationItems: NavigationItem[] = navigation
    .filter((item) => item.permission === undefined || permissions?.includes(item.permission) === true)
    .filter((item) => !('roleCode' in item) || user?.roleCode === item.roleCode)
    .map((item) => ({
      id: item.to ?? item.externalHref,
      label: t(item.label),
      to: item.to,
      externalHref: item.externalHref,
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
              mx-auto relative flex h-16 w-full max-w-6xl items-center
              justify-between gap-3 px-4
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
            <div className="shrink-0">
              <BrandLogo text="SERVICE FACTORY" to="/" />
            </div>
            <Navigation
              items={navigationItems}
              variant={{ base: 'side', lg: 'bar' }}
              sideOpen={isNavigationOpen}
              sideId="service-navigation-side"
              label={t('service.navigation.menu')}
              onNavigate={() => setIsNavigationOpen(false)}
              sideClassName="absolute left-0 right-0 top-full z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b bg-background p-4 shadow-lg lg:hidden"
            />
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="
                hidden items-center gap-2
                lg:flex
              "
              >
                <LocaleSwitcher />
                <ThemeToggle />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="
                  shrink-0
                  lg:hidden
                "
                aria-label={t('service.navigation.openMenu')}
                aria-expanded={isNavigationOpen}
                aria-controls="service-navigation-side"
                ref={navigationTriggerRef}
                onClick={() => setIsNavigationOpen((open) => !open)}
              >
                <Menu className="size-4" />
              </Button>
              <div className="lg:hidden">
                <LocaleSwitcher />
              </div>
              <div className="lg:hidden">
                <ThemeToggle />
              </div>
              {user && <ServiceNotifications userId={user.id} canAccessSupport={permissions?.includes(ServicePermission.support.read.code) === true} />}
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
                    className={`
                      ${buttonVariants({ variant: 'outline', size: 'icon' })}
                      shrink-0
                    `}
                    to="/login"
                    search={{ callback: `${location.pathname}${location.searchStr}${location.hash}` }}
                    aria-label={t('service.navigation.login')}
                    title={t('service.navigation.login')}
                  >
                    <LogIn className="size-4" />
                  </Link>
                )}
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
