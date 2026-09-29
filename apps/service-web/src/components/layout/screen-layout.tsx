import type { ReactNode } from 'react';

import { cn } from '#/.generated/shadcn/lib/utils';
import { BrandLogo, LocaleSwitcher, ThemeToggle } from '#/components/app';
import { getSlotElements } from '#/components/slot';

export type ScreenLayoutSize = 'sm' | 'md' | 'lg' | 'xl';

type ScreenLayoutContentProps = {
  children: ReactNode
  className?: string
  size?: ScreenLayoutSize
};

const sizeClasses: Record<ScreenLayoutSize, string> = {
  sm: 'h-[400px] max-h-[calc(100dvh-8rem)] max-w-sm',
  md: 'h-[500px] max-h-[calc(100dvh-8rem)] max-w-md',
  lg: 'h-[600px] max-h-[calc(100dvh-8rem)] max-w-lg',
  xl: 'h-[700px] max-h-[calc(100dvh-8rem)] max-w-2xl',
};

function ScreenLayoutContent({ children, className, size = 'md' }: ScreenLayoutContentProps) {
  return (
    <div className={cn('w-full', sizeClasses[size], className)}>
      {children}
    </div>
  );
}

function ScreenLayoutAddon({ children }: { children: ReactNode }) {
  return children;
}

function ScreenLayoutComponent({ children }: { children: ReactNode }) {
  const content = getSlotElements(children, ScreenLayoutContent);
  const addon = getSlotElements(children, ScreenLayoutAddon);

  return (
    <div className="relative size-full">
      <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
      <div className="grid size-full grid-rows-[1fr_auto_1fr] gap-6 p-4">
        <header className="
          mx-auto flex size-full max-w-md items-end justify-center
        "
        >
          <BrandLogo />
        </header>
        <main className="mx-auto flex size-full items-center justify-center">
          {content}
        </main>
        <footer className="
          mx-auto flex size-full max-w-md items-start justify-center text-xs
          text-muted-foreground
        "
        >
          {addon}
        </footer>
      </div>
    </div>
  );
}

export const ScreenLayout = Object.assign(ScreenLayoutComponent, {
  Content: ScreenLayoutContent,
  Addon: ScreenLayoutAddon,
});
