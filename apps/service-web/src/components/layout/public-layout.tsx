import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';

import { getAuthControllerMeV1QueryKey, useAuthControllerLogoutV1 } from '#/.generated/api/endpoints/auth/auth';
import { buttonVariants } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { BrandLogo, ThemeToggle } from '#/components/app';
import { authUserAtom, tokenStorage } from '#/store/token';

const publicNavigation = [
  { label: 'Q&A', to: '/qna' as const },
  { label: 'FAQ', to: '/faq' as const },
  { label: '서비스 약관', to: '/service-terms' as const },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authUser = useAtomValue(authUserAtom);
  const logoutMutation = useAuthControllerLogoutV1();
  const isAuthenticated = Boolean(authUser);

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync({ data: {} });
    }
    finally {
      tokenStorage.clear();
      queryClient.removeQueries({ queryKey: getAuthControllerMeV1QueryKey() });
      await navigate({ to: '/login', replace: true });
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
                {item.label}
              </Link>
            ))}
            <ThemeToggle />
            {isAuthenticated
              ? (
                <button
                  type="button"
                  className={buttonVariants({ size: 'sm' })}
                  disabled={logoutMutation.isPending}
                  onClick={() => void logout()}
                >
                  {logoutMutation.isPending ? '로그아웃 중...' : '로그아웃'}
                </button>
              )
              : <Link className={buttonVariants({ size: 'sm' })} to="/login">로그인</Link>}
          </nav>
        </div>
      </header>
      <main className="min-h-0 flex-1 scroll-y">{children}</main>
    </div>
  );
}

export const PublicLayout = AppLayout;
