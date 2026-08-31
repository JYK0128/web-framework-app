import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '#/.generated/shadcn/lib/utils';

export type AppHeaderProps = ComponentPropsWithoutRef<'header'>;

export function AppHeader({ children, className, ...props }: AppHeaderProps) {
  return <header {...props} className={cn('app-header', className)}>{children}</header>;
}
