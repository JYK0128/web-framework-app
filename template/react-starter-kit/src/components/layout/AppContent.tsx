import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '#/.generated/shadcn/lib/utils';

export type AppContentProps = ComponentPropsWithoutRef<'main'>;

export function AppContent({ children, className, ...props }: AppContentProps) {
  return <main {...props} className={cn('app-content', className)}>{children}</main>;
}
