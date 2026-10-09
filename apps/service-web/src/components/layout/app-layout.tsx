import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { Bell, Check, Globe, LogIn, LogOut, Menu, Moon, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';

import { useAuthControllerLogoutV1 } from '#/.generated/api/endpoints/auth/auth';
import type { MeResponse } from '#/.generated/api/model';
import { Button, buttonVariants, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { BrandLogo, LocaleSwitcher, ThemeToggle } from '#/components/app';
import { type AppLocale, locales } from '#/core/isomorphic/i18n';
import { useI18n } from '#/hooks';

const navigation = [
  { label: 'service.navigation.home', to: '/' as const },
  { label: 'service.navigation.support', to: '/support' as const },
  { label: 'service.navigation.qna', to: '/qna' as const },
  { label: 'service.navigation.faq', to: '/faq' as const },
];

export function AppLayout({ children, user }: { children: ReactNode, user: MeResponse | null }) {
  const { i18n, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutMutation = useAuthControllerLogoutV1();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const currentLocale = i18n.language;
  const hasLocalePath
    = location.pathname === '/'
      || locales.some(({ code }) => location.pathname === `/${code}` || location.pathname === `/${code}/`);

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
          px-4
          md:px-6
        "
        >
          <BrandLogo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="서비스 메뉴">
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
            <div className="hidden items-center gap-2 lg:flex">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={(props) => (
                    <Button {...props} type="button" variant="outline" size="icon" className="hidden lg:inline-flex" aria-label={t('app.alertBell.openAlerts')}>
                      <Bell className="size-4" />
                    </Button>
                  )}
                />
                <DropdownMenuContent align="end" className="w-64">
                  <p className="p-4 text-sm text-muted-foreground">{t('app.alertBell.noAlerts')}</p>
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
                        className="h-10 gap-2 rounded-full px-1 sm:px-2"
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
            <DropdownMenu>
              <DropdownMenuTrigger
                render={(props) => (
                  <Button {...props} type="button" variant="outline" size="icon" className="lg:hidden" aria-label={t('service.navigation.openMenu')}>
                    <Menu className="size-4" />
                  </Button>
                )}
              />
              <DropdownMenuContent align="end" className="w-56 lg:hidden">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t('service.navigation.menu')}</DropdownMenuLabel>
                  {navigation.map((item) => (
                    <DropdownMenuItem
                      key={item.to}
                      render={<Link to={item.to} />}
                      className={location.pathname === item.to ? 'bg-accent text-accent-foreground' : undefined}
                    >
                      {t(item.label)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Globe />
                    {t('app.localeSwitcher.language')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {locales.map((locale) => (
                      <DropdownMenuItem key={locale.code} onClick={() => changeLocale(locale.code)}>
                        {locale.label}
                        {currentLocale === locale.code && <Check className="ml-auto" />}
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
