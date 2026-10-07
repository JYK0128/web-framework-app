import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { Bell, LogOut, User } from 'lucide-react';
import type { ReactNode } from 'react';

import { useAuthControllerLogoutV1 } from '#/.generated/api/endpoints/auth/auth';
import type { MeResponse } from '#/.generated/api/model';
import { Button, buttonVariants, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { BrandLogo, LocaleSwitcher, ThemeToggle } from '#/components/app';
import { useI18n } from '#/hooks';
import { tokenStorage } from '#/store/token';

const navigation = [
  { label: 'service.navigation.home', to: '/' as const },
  { label: 'service.navigation.support', to: '/support' as const },
  { label: 'service.navigation.qna', to: '/qna' as const },
  { label: 'service.navigation.faq', to: '/faq' as const },
];

export function AppLayout({ children, user }: { children: ReactNode, user: MeResponse | null }) {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutMutation = useAuthControllerLogoutV1();

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync({ data: {} });
    }
    finally {
      tokenStorage.clear();
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
          px-4
          md:px-6
        "
        >
          <BrandLogo />
          <nav className="flex items-center gap-1" aria-label="서비스 메뉴">
            {navigation.map((item) => (
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
          </nav>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={(props) => (
                    <Button {...props} type="button" variant="outline" size="icon" aria-label={t('app.alertBell.openAlerts')}>
                      <Bell className="size-4" />
                    </Button>
                  )}
                />
                <DropdownMenuContent align="end" className="w-64">
                  <p className="p-4 text-sm text-muted-foreground">{t('app.alertBell.noAlerts')}</p>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <ThemeToggle />
            {user
              ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={(props) => (
                      <Button
                        {...props}
                        type="button"
                        variant="ghost"
                        className="h-10 gap-2 rounded-full px-2"
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
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  to="/login"
                  search={{ callback: `${location.pathname}${location.searchStr}${location.hash}` }}
                >
                  {t('service.navigation.login')}
                </Link>
              )}
          </div>
        </div>
      </header>
      <main className="min-h-0 flex-1 scroll-y">{children}</main>
    </div>
  );
}
