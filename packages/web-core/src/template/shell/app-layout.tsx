import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '#utils';

function AppLayoutRoot({ children, className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div {...props} className={cn('flex size-full', className)}>{children}</div>;
}

function AppLayoutSidebar({ children, className, ...props }: ComponentPropsWithoutRef<'aside'>) {
  return <aside {...props} className={className}>{children}</aside>;
}

function AppLayoutMain({ children, className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      {...props}
      className={cn(`grid min-h-0 min-w-0 flex-1 grid-rows-[auto_1fr]`, className)}
    >
      {children}
    </div>
  );
}

function AppLayoutHeader({ children, className, ...props }: ComponentPropsWithoutRef<'header'>) {
  return <header {...props} className={cn('border-b', className)}>{children}</header>;
}

function AppLayoutContent({ children, className, ...props }: ComponentPropsWithoutRef<'main'>) {
  return <main {...props} className={cn('min-h-0 min-w-0 scroll-y', className)}>{children}</main>;
}

export const AppLayout = {
  Root: AppLayoutRoot,
  Sidebar: AppLayoutSidebar,
  Main: AppLayoutMain,
  Header: AppLayoutHeader,
  Content: AppLayoutContent,
};
