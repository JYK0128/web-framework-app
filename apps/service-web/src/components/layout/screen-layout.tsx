import { ScreenLayout as CoreScreenLayout, type ScreenLayoutProps } from '@pkg/web-core/layout';
import { ThemeToggle } from '@pkg/web-core/ui';
import { cn } from '@pkg/web-core/utils';
import type { ComponentProps } from 'react';

import { BrandLogo, LocaleSwitcher } from '#/components/app';

export type { ScreenLayoutSize } from '@pkg/web-core/layout';

function AppScreenLayoutContent({ className, ...props }: ComponentProps<typeof CoreScreenLayout.Content>) {
  return <CoreScreenLayout.Content {...props} className={cn('mx-auto', className)} />;
}

function AppScreenLayoutAddon({ className, ...props }: ComponentProps<typeof CoreScreenLayout.Footer>) {
  return <CoreScreenLayout.Footer {...props} className={cn('mx-auto flex size-full max-w-md items-start justify-center', className)} />;
}

function AppScreenLayout({ children, className, ...props }: ScreenLayoutProps) {
  return (
    <CoreScreenLayout {...props} className={cn('grid grid-rows-[1fr_auto_1fr]', className)}>
      <CoreScreenLayout.Tools className="absolute right-4 top-4 z-50">
        <LocaleSwitcher />
        <ThemeToggle />
      </CoreScreenLayout.Tools>
      <CoreScreenLayout.Header className="mx-auto size-full max-w-md items-end justify-center">
        <CoreScreenLayout.Logo>
          <BrandLogo />
        </CoreScreenLayout.Logo>
      </CoreScreenLayout.Header>
      {children}
    </CoreScreenLayout>
  );
}

export const ScreenLayout = Object.assign(AppScreenLayout, {
  Header: CoreScreenLayout.Header,
  Logo: CoreScreenLayout.Logo,
  Tools: CoreScreenLayout.Tools,
  Content: AppScreenLayoutContent,
  Footer: AppScreenLayoutAddon,
  Addon: AppScreenLayoutAddon,
});
