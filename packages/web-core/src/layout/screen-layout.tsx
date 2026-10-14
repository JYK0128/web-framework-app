import { cn } from '@pkg/web-core/utils';
import type { ComponentProps } from 'react';

export type ScreenLayoutSize = 'sm' | 'md' | 'lg' | 'xl';
export type ScreenLayoutProps = ComponentProps<'div'>;
export type ScreenLayoutContentProps = ComponentProps<'main'> & {
  size?: ScreenLayoutSize
};

const sizeClasses: Record<ScreenLayoutSize, string> = {
  sm: 'h-[400px] max-h-[calc(100dvh-8rem)] max-w-sm',
  md: 'h-[500px] max-h-[calc(100dvh-8rem)] max-w-md',
  lg: 'h-[600px] max-h-[calc(100dvh-8rem)] max-w-lg',
  xl: 'h-[700px] max-h-[calc(100dvh-8rem)] max-w-2xl',
};

function ScreenLayoutRoot({ className, ...props }: ScreenLayoutProps) {
  return <div {...props} className={cn('relative size-full gap-6 p-4', className)} />;
}

function ScreenLayoutHeader({ className, ...props }: ComponentProps<'header'>) {
  return <header {...props} className={cn('flex items-center justify-between gap-4', className)} />;
}

function ScreenLayoutLogo({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('flex shrink-0 items-center justify-center', className)} />;
}

function ScreenLayoutTools({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cn('flex items-center gap-2', className)} />;
}

function ScreenLayoutContent({ className, size = 'md', ...props }: ScreenLayoutContentProps) {
  return <main {...props} className={cn('w-full', sizeClasses[size], className)} />;
}

function ScreenLayoutFooter({ className, ...props }: ComponentProps<'footer'>) {
  return <footer {...props} className={cn('text-xs text-muted-foreground', className)} />;
}

/** Semantic regions render in JSX order; the app owns their placement. */
export const ScreenLayout = Object.assign(ScreenLayoutRoot, {
  Header: ScreenLayoutHeader,
  Logo: ScreenLayoutLogo,
  Tools: ScreenLayoutTools,
  Content: ScreenLayoutContent,
  Footer: ScreenLayoutFooter,
  Addon: ScreenLayoutFooter,
});
