import { createContext, createElement, type ReactNode, useContext } from 'react';

const PermissionContext = createContext<readonly string[] | null>(null);

export function PermissionProvider({
  permissions,
  children,
}: {
  permissions?: readonly string[] | null
  children: ReactNode
}) {
  return createElement(PermissionContext.Provider, { value: permissions ?? null }, children);
}

export function usePermissions() {
  return useContext(PermissionContext);
}
