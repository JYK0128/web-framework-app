import type { UserProfileResponsePermissions } from '#/.generated/api/model';

export type PermissionName = `${string}:${string}`;
export type RolePermissions = UserProfileResponsePermissions;

export function hasPermission(
  permissions: RolePermissions | null | undefined,
  permission: PermissionName,
): boolean {
  const separatorIndex = permission.indexOf(':');
  if (separatorIndex <= 0 || separatorIndex === permission.length - 1) return false;

  const resource = permission.slice(0, separatorIndex);
  const action = permission.slice(separatorIndex + 1);
  return permissions?.[resource]?.includes(action) === true;
}
