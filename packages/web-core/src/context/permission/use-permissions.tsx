import { createContext, type ReactNode, useContext } from 'react';

const PermissionContext = createContext<readonly string[] | null>(null);

export function PermissionProvider({
  permissions,
  children,
}: {
  permissions?: readonly string[] | null
  children: ReactNode
}) {
  return (
    <PermissionContext.Provider value={permissions ?? null}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionContext);
}
