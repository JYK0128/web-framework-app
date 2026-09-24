import type { PermissionCode } from '@pkg/shared';
import { useAtomValue } from 'jotai';
import type { ComponentProps, ReactNode } from 'react';

import { Button } from '#/.generated/shadcn/components/ui';
import { authUserAtom } from '#/store/auth';

type ActionProps = Omit<ComponentProps<typeof Button>, 'children'> & {
  permission: PermissionCode
  children?: ReactNode
  fallback?: ReactNode
  asChild?: boolean
};

/** A permission-aware Button. Use asChild to protect another action component. */
export function Action({ permission, children, fallback = null, asChild = false, ...buttonProps }: ActionProps) {
  const user = useAtomValue(authUserAtom);
  if (!user?.permissions.includes(permission)) return fallback;
  if (asChild) return children;
  return <Button {...buttonProps}>{children}</Button>;
}
