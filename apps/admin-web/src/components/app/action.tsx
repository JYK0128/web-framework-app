import { useRouteContext } from '@tanstack/react-router';
import type { ComponentProps, ReactElement, ReactNode } from 'react';

import { Button } from '#/.generated/shadcn/components/ui';
import type { PermissionCode } from '#/configs/app.config';

type ActionProps = Omit<ComponentProps<typeof Button>, 'children' | 'render'> & {
  permission: PermissionCode
  children?: ReactNode
  fallback?: ReactNode
  render?: ReactElement
};

/** A permission-aware Button. Use render to protect another action component. */
export function Action({ permission, children, fallback = null, render, ...buttonProps }: ActionProps) {
  const { user } = useRouteContext({ from: '/_protected' });
  if (!user?.permissions.includes(permission)) return fallback;
  if (render) return render;
  return <Button {...buttonProps}>{children}</Button>;
}
