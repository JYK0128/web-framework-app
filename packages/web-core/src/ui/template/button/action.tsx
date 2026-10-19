import type { ComponentProps, ReactNode } from 'react';

import { usePermissions } from '#context/permission';
import { Button } from '#ui';

export type ActionProps = ComponentProps<typeof Button> & {
  permission: string
  fallback?: ReactNode
};

/** Renders an action only when the current user has the required permission. */
export function Action({
  permission,
  children,
  fallback = null,
  ...buttonProps
}: ActionProps) {
  const permissions = usePermissions();
  if (!permissions?.includes(permission)) return fallback;
  return <Button {...buttonProps}>{children}</Button>;
}
