import { Activity, Bell, FileText, HelpCircle, Lock, MessageCircleQuestion, Users } from 'lucide-react';

export type CrudAction = 'create' | 'read' | 'update' | 'delete';

export const CRUD_ACTIONS: readonly CrudAction[] = ['create', 'read', 'update', 'delete'];

export const RESOURCES = [
  { key: 'term', icon: FileText },
  { key: 'notice', icon: Bell },
  { key: 'faq', icon: HelpCircle },
  { key: 'role', icon: Lock },
  { key: 'user', icon: Users },
  { key: 'inquiry', icon: MessageCircleQuestion },
  { key: 'activityLog', icon: Activity },
] as const;

export type Resource = (typeof RESOURCES)[number];

export function toggleCrudAction(
  permissions: Record<string, CrudAction[]>,
  resourceKey: string,
  action: CrudAction,
) {
  const current = permissions[resourceKey] || [];
  const next = current.includes(action)
    ? current.filter((item) => item !== action)
    : [...current, action];
  return { ...permissions, [resourceKey]: next };
}

export function toggleAllCrudActions(
  permissions: Record<string, CrudAction[]>,
  resourceKey: string,
) {
  const current = permissions[resourceKey] || [];
  const isAllSelected = CRUD_ACTIONS.every((action) => current.includes(action));
  return { ...permissions, [resourceKey]: isAllSelected ? [] : [...CRUD_ACTIONS] };
}
