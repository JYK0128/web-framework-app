import type { PermissionCode } from '@pkg/shared';
import { useAtomValue } from 'jotai';
import type { ReactNode } from 'react';

import { authUserAtom } from '#/store/auth';

type ActionProps = {
  permission: PermissionCode
  children: ReactNode
  fallback?: ReactNode
};

/** Renders the wrapped action with its original props only when permission is granted. */
export function Action({ permission, children, fallback = null }: ActionProps) {
  const user = useAtomValue(authUserAtom);
  return user?.permissions.includes(permission) ? children : fallback;
}
