import { Link, useLocation } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { Button } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { BrandLogo, ThemeToggle } from '#/components/app';

const publicNavigation = [
  { label: 'FAQ', to: '/faq' as const },
  { label: '서비스 약관', to: '/service-terms' as const },
];

export function PublicLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

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
              <Button
                key={item.to}
                variant="ghost"
                size="sm"
                className={cn(location.pathname === item.to && `
                  bg-accent text-accent-foreground
                `)}
                render={<Link to={item.to} />}
              >
                {item.label}
              </Button>
            ))}
            <ThemeToggle />
            <Button size="sm" render={<Link to="/login" />}>로그인</Button>
          </nav>
        </div>
      </header>
      <main className="min-h-0 flex-1 scroll-y">{children}</main>
    </div>
  );
}
