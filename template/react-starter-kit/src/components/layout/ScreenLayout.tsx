import type { ReactNode } from 'react';

import { BrandLogo } from '#/components/app';
import { getSlotElements } from '#/core/isomorphic/react-slots';

import { LocaleSwitcher } from './components/locale-switcher';
import { ThemeToggle } from './components/theme-toggle';

type ScreenLayoutContentProps = {
  children: ReactNode
};

function ScreenLayoutContent({ children }: ScreenLayoutContentProps) {
  return children;
}

type ScreenLayoutAddonProps = {
  children: ReactNode
};

function ScreenLayoutAddon({ children }: ScreenLayoutAddonProps) {
  return children;
}

export type ScreenLayoutProps = {
  /** 메인 콘텐츠 본문 (ScreenLayout.Content 및 ScreenLayout.Addon 포함) */
  children: ReactNode
};

function ScreenLayoutComponent({
  children,
}: ScreenLayoutProps) {
  const content = getSlotElements(children, ScreenLayoutContent);
  const addonContent = getSlotElements(children, ScreenLayoutAddon);

  return (
    <div className="relative size-full">
      {/* 0. 우측 상단 유틸리티 컨트롤 (언어 / 테마 토글) */}
      <div className="absolute right-4 top-4 z-50 flex items-center gap-2 safe-mr-2 safe-mt-2">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <div className="grid size-full grid-rows-[1fr_auto_1fr] gap-6 safe-p-4">
        {/* 1. 상단: 브랜드 로고 (바닥 밀착 + grid gap-6으로 간격 제어) */}
        <header className="
          mx-auto flex size-full max-w-md items-end justify-center
        "
        >
          <BrandLogo />
        </header>

        {/* 2. 메인: ScreenLayout.Content 슬롯 영역 */}
        <main className="
          mx-auto flex size-full max-w-md items-center justify-center
        "
        >
          {content}
        </main>

        {/* 3. 하단: ScreenLayout.Addon 슬롯 영역 (천장 밀착 + grid gap-6으로 간격 제어) */}
        <footer className="
          mx-auto flex size-full max-w-md flex-row-reverse items-start
          justify-between gap-4 text-xs text-muted-foreground
        "
        >
          {addonContent}
        </footer>
      </div>
    </div>
  );
}

export const ScreenLayout = Object.assign(ScreenLayoutComponent, {
  Content: ScreenLayoutContent,
  Addon: ScreenLayoutAddon,
});
