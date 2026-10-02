import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { getAuthControllerMeV1QueryKey, useAuthControllerLogoutV1 } from '#/.generated/api/endpoints/auth/auth';
import type { MeResponse } from '#/.generated/api/model';
import { buttonVariants } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { BrandLogo, LocaleSwitcher, ThemeToggle } from '#/components/app';
import { useI18n } from '#/hooks';
import { tokenStorage } from '#/store/token';

const publicNavigation = [
  { label: 'service.navigation.support', to: '/support' as const },
  { label: 'service.navigation.qna', to: '/qna' as const },
  { label: 'service.navigation.faq', to: '/faq' as const },
  { label: 'service.navigation.terms', to: '/service-terms' as const },
];

export function AppLayout({ children, user }: { children: ReactNode, user: MeResponse | null }) {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutMutation = useAuthControllerLogoutV1();
  const isAuthenticated = Boolean(user);

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync({ data: {} });
    }
    finally {
      tokenStorage.clear();
      queryClient.removeQueries({ queryKey: getAuthControllerMeV1QueryKey() });
      await navigate({ to: '/', replace: true });
    }
  };

  return (
    <div className="flex size-full flex-col">
      <header className="shrink-0 border-b bg-background/95 backdrop-blur-sm">
        <div className="
          mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4
          px-4
          md:px-6
        "
        >
          <BrandLogo />
          <nav className="flex items-center gap-1" aria-label="공개 메뉴">
            {publicNavigation.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), location.pathname === item.to && `
                  bg-accent text-accent-foreground
                `)}
              >
                {t(item.label)}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to="/profile"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), location.pathname === '/profile' && `
                  bg-accent text-accent-foreground
                `)}
              >
                {t('service.navigation.security')}
              </Link>
            )}
            <LocaleSwitcher />
            <ThemeToggle />
            {isAuthenticated
              ? (
                <button
                  type="button"
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  disabled={logoutMutation.isPending}
                  onClick={() => void logout()}
                >
                  {t(logoutMutation.isPending ? 'service.navigation.loggingOut' : 'service.navigation.logout')}
                </button>
              )
              : <Link className={buttonVariants({ variant: 'outline', size: 'sm' })} to="/login">{t('service.navigation.login')}</Link>}
          </nav>
        </div>
      </header>
      <main className="min-h-0 flex-1 scroll-y">{children}</main>
    </div>
  );
}
