import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { Bell, FileText, HelpCircle, Loader2, Lock, RotateCcw, Save, Search, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getRolesControllerGetRolesQueryKey, useRolesControllerGetRoles, useRolesControllerUpdateRolePermissions } from '#/.generated/api/endpoints/roles/roles';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Switch } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';
import { hasPermission } from '#/core/auth/permissions';

export type CrudAction = 'create' | 'read' | 'update' | 'delete';

const CRUD_ACTIONS: readonly CrudAction[] = ['create', 'read', 'update', 'delete'];

const RESOURCES = [
  { key: 'term', icon: FileText },
  { key: 'notice', icon: Bell },
  { key: 'faq', icon: HelpCircle },
  { key: 'role', icon: Lock },
  { key: 'user', icon: Users },
] as const;

export const Route = createFileRoute('/_protected/permission/')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'role:read')) {
      throw notFound({ routeId: Route.id });
    }
  },
  component: PermissionPageComponent,
});

function toggleCrudAction(
  permissions: Record<string, CrudAction[]>,
  resourceKey: string,
  action: CrudAction,
): Record<string, CrudAction[]> {
  const current = permissions[resourceKey] || [];
  const next = current.includes(action)
    ? current.filter((a) => a !== action)
    : [...current, action];
  return { ...permissions, [resourceKey]: next };
}

function toggleAllCrudActions(
  permissions: Record<string, CrudAction[]>,
  resourceKey: string,
): Record<string, CrudAction[]> {
  const current = permissions[resourceKey] || [];
  const isAllSelected = CRUD_ACTIONS.every((action) => current.includes(action));
  return {
    ...permissions,
    [resourceKey]: isAllSelected ? [] : [...CRUD_ACTIONS],
  };
}

interface ResourcePermissionCardProps {
  resource: (typeof RESOURCES)[number]
  activeCrud: CrudAction[]
  onToggleCrud: (resourceKey: string, action: CrudAction) => void
  onToggleAllCrud: (resourceKey: string) => void
}

function ResourcePermissionCard({
  resource,
  activeCrud,
  onToggleCrud,
  onToggleAllCrud,
}: ResourcePermissionCardProps) {
  const { t } = useI18n();
  const ResourceIcon = resource.icon;
  const isAllSelected = CRUD_ACTIONS.every((action) => activeCrud.includes(action));

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-card">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <ResourceIcon className="size-4 text-primary" />
          <span className="text-sm font-semibold">{t(`permission.resources.${resource.key}`)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">{t('permission.allCrud')}</span>
          <Switch
            checked={isAllSelected}
            onCheckedChange={() => onToggleAllCrud(resource.key)}
          />
        </div>
      </div>

      <div className="
        grid grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-4
        gap-3 pt-1
      "
      >
        {CRUD_ACTIONS.map((action) => {
          const isChecked = activeCrud.includes(action);
          return (
            <div
              key={action}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('[data-slot="switch"]')) {
                  return;
                }

                onToggleCrud(resource.key, action);
              }}
              className={`
                flex items-center justify-between p-3 rounded-md border text-xs
                cursor-pointer transition-colors
                ${
            isChecked
              ? 'bg-primary/5 border-primary/40 font-medium'
              : `
                bg-background
                hover:bg-muted/40
                text-muted-foreground
              `
            }
              `}
            >
              <div className="font-semibold capitalize text-foreground">
                {t(`permission.actions.${action}`)}
              </div>

              <Switch
                checked={isChecked}
                onCheckedChange={() => onToggleCrud(resource.key, action)}
                className="ml-2 shrink-0"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PermissionPageComponent() {
  const { t } = useI18n();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: rolesData, isLoading: isRolesLoading } = useRolesControllerGetRoles();

  const fetchedRoles = rolesData?.roles ?? [];

  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [roleSearch, setRoleSearch] = useState<string>('');

  const defaultRoleId = fetchedRoles.find((r) => (r.name as unknown as string) === (user.role as unknown as string))?.id ?? fetchedRoles[0]?.id ?? '';
  const activeRoleId = selectedRoleId || defaultRoleId;
  const selectedRole = fetchedRoles.find((r) => r.id === activeRoleId) ?? { id: '', name: '', permissions: {} };

  const updatePermissionsMutation = useRolesControllerUpdateRolePermissions({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getRolesControllerGetRolesQueryKey() });
      },
    },
  });

  const permissionForm = useAppForm({
    defaultValues: {
      permissions: (selectedRole.permissions || {}),
    },
    onSubmit: async ({ value }) => {
      if (!selectedRole.id) return;
      await updatePermissionsMutation.mutateAsync({
        id: selectedRole.id,
        data: {
          permissions: value.permissions,
        },
      });
    },
  });

  useEffect(() => {
    if (selectedRole.id) {
      permissionForm.reset({ permissions: (selectedRole.permissions || {}) });
    }
  }, [selectedRole.id, selectedRole.permissions, permissionForm]);

  const handleToggleCrudPermission = (resourceKey: string, action: CrudAction) => {
    const current = (permissionForm.getFieldValue('permissions') || {});
    permissionForm.setFieldValue('permissions', toggleCrudAction(current, resourceKey, action));
  };

  const handleToggleAllResourceCrud = (resourceKey: string) => {
    const current = (permissionForm.getFieldValue('permissions') || {});
    permissionForm.setFieldValue('permissions', toggleAllCrudActions(current, resourceKey));
  };

  const filteredRoles = fetchedRoles.filter(
    (r) =>
      (r.name as unknown as string).toLowerCase().includes(roleSearch.toLowerCase())
      || r.id.toLowerCase().includes(roleSearch.toLowerCase()),
  );

  return (
    <permissionForm.AppForm>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void permissionForm.handleSubmit();
        }}
        className="
          mx-auto grid size-full max-w-7xl content-start gap-6 scroll-y p-6
        "
      >
        {/* Header */}
        <div className="
          grid gap-4
          sm:flex sm:items-center sm:justify-between
        "
        >
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('permission.title')}</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('permission.description')}
            </p>
          </div>

          <permissionForm.Subscribe selector={(state) => [state.isSubmitting, state.isDirty] as const}>
            {([isSubmitting, isDirty]) => (
              <div className="flex items-center gap-2">
                {isDirty && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => permissionForm.reset()}
                    disabled={isSubmitting}
                    className="gap-1.5 text-xs"
                  >
                    <RotateCcw className="size-3.5" />
                    {' '}
                    {t('permission.reset')}
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={!isDirty || isSubmitting}
                  size="sm"
                  className="gap-1.5 text-xs"
                >
                  {isSubmitting
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : <Save className="size-3.5" />}
                  {' '}
                  {t('permission.save')}
                </Button>
              </div>
            )}
          </permissionForm.Subscribe>
        </div>

        {/* Grid Layout */}
        <div className="
          grid grid-cols-1 gap-6
          lg:grid-cols-12
        "
        >
          {/* Left Column: Role Selection Card */}
          <Card className="
            lg:col-span-4
            grid h-[600px] grid-rows-[auto_1fr]
          "
          >
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-base">{t('permission.roles')}</CardTitle>
              <CardDescription className="text-xs">
                {isRolesLoading ? t('permission.loading') : t('permission.selectRole', { count: fetchedRoles.length })}
              </CardDescription>
              <div className="relative mt-2">
                <Search className="
                  absolute left-2.5 top-2.5 size-4 text-muted-foreground
                "
                />
                <Input
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder={t('permission.searchRole')}
                  className="h-9 pl-9 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 scroll-y p-2">
              {filteredRoles.map((role) => {
                const isSelected = role.id === selectedRole.id;
                const isCurrent = (role.name as unknown as string) === (user.role as unknown as string);
                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`
                      flex items-center justify-between p-3 rounded-lg
                      cursor-pointer border transition-all text-xs
                      ${
                  isSelected
                    ? 'bg-primary/5 border-primary shadow-xs font-medium'
                    : `
                      hover:bg-muted/50
                      border-transparent text-muted-foreground
                    `
                  }
                    `}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={isSelected
                        ? `text-foreground font-semibold`
                        : ''}
                      >
                        {role.name as unknown as string}
                      </span>
                      {isCurrent && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 shrink-0"
                        >
                          {t('permission.current')}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Right Column: Permission Matrix Card */}
          <Card className="
            lg:col-span-8
            grid h-[600px] grid-rows-[auto_1fr]
          "
          >
            <CardHeader className="
              p-4 border-b flex flex-row items-center justify-between space-y-0
            "
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  {(selectedRole.name as unknown as string) === 'user'
                    ? <UserCheck className="size-5" />
                    : (
                      <Lock className="size-5" />
                    )}
                </div>
                <CardTitle className="text-base">{selectedRole.name as unknown as string}</CardTitle>
              </div>
            </CardHeader>

            <permissionForm.Subscribe selector={(state) => state.values.permissions}>
              {(currentPermissions = {}) => (
                <CardContent className="space-y-4 scroll-y p-4">
                  {RESOURCES.map((resource) => (
                    <ResourcePermissionCard
                      key={resource.key}
                      resource={resource}
                      activeCrud={(currentPermissions as Record<string, CrudAction[]>)[resource.key] || []}
                      onToggleCrud={handleToggleCrudPermission}
                      onToggleAllCrud={handleToggleAllResourceCrud}
                    />
                  ))}
                </CardContent>
              )}
            </permissionForm.Subscribe>
          </Card>
        </div>
      </form>
    </permissionForm.AppForm>
  );
}
