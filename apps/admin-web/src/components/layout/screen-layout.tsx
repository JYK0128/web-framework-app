import type { ReactNode } from 'react';

import { BrandLogo, ThemeToggle } from '#/components/app';
import { getSlotElements } from '#/components/slot';

function ScreenLayoutContent({ children }: { children: ReactNode }) {
  return children;
}

function ScreenLayoutAddon({ children }: { children: ReactNode }) {
  return children;
}

function ScreenLayoutComponent({ children }: { children: ReactNode }) {
  const content = getSlotElements(children, ScreenLayoutContent);
  const addon = getSlotElements(children, ScreenLayoutAddon);

  return (
    <div className="relative size-full">
      <div className="absolute right-4 top-4 z-50"><ThemeToggle /></div>
      <div className="grid size-full grid-rows-[1fr_auto_1fr] gap-6 p-4">
        <header className="
          mx-auto flex size-full max-w-md items-end justify-center
        "
        >
          <BrandLogo />
        </header>
        <main className="
          mx-auto flex size-full max-w-md items-center justify-center
        "
        >
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
