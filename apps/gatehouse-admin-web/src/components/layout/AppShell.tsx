import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '#/.generated/shadcn/lib/utils';

export type AppShellProps = ComponentPropsWithoutRef<'div'>;

export function AppShell({ children, className, ...props }: AppShellProps) {
  return <div {...props} className={cn('app', className)}>{children}</div>;
}
