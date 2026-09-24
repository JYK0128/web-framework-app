import type { PermissionCode } from '@pkg/shared';
import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';

import { authUserAtom } from '#/store/auth';

type PermissionGateProps = {
  permission: PermissionCode
  children: ReactNode
  fallback?: ReactNode
};

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const user = useAtomValue(authUserAtom);
  return user?.permissions.includes(permission) ? children : fallback;
}
