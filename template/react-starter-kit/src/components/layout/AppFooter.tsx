import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '#/.generated/shadcn/lib/utils';

export type AppFooterProps = ComponentPropsWithoutRef<'footer'>;

export function AppFooter({ children, className, ...props }: AppFooterProps) {
  return <footer {...props} className={cn('app-footer', className)}>{children}</footer>;
}
