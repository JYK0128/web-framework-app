import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { CheckCircle2, FileText, Loader2, Lock, RotateCcw, Save, Search, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getRolesControllerGetRolesQueryKey, useRolesControllerGetRoles, useRolesControllerUpdateRolePermissions } from '#/.generated/api/endpoints/roles/roles';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Switch } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';

export type CrudAction = 'create' | 'read' | 'update' | 'delete';

const CRUD_ACTIONS: readonly CrudAction[] = ['create', 'read', 'update', 'delete'];

const RESOURCES = [
  { key: 'term', name: 'Term', icon: FileText },
  { key: 'role', name: 'Role', icon: Lock },
] as const;

export const Route = createFileRoute('/_protected/permission/')({
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
  const ResourceIcon = resource.icon;
  const isAllSelected = CRUD_ACTIONS.every((action) => activeCrud.includes(action));

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-card">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <ResourceIcon className="size-4 text-primary" />
          <span className="text-sm font-semibold">{resource.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">All CRUD</span>
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
              onClick={() => onToggleCrud(resource.key, action)}
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
                {action}
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
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: rolesData, isLoading: isRolesLoading } = useRolesControllerGetRoles();

  const fetchedRoles = rolesData?.roles ?? [];

  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [roleSearch, setRoleSearch] = useState<string>('');

  const defaultRoleId = fetchedRoles.find((r) => r.name === user.role)?.id ?? fetchedRoles[0]?.id ?? '';
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
      permissions: (selectedRole.permissions || {}) as Record<string, CrudAction[]>,
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
      permissionForm.reset({ permissions: (selectedRole.permissions || {}) as Record<string, CrudAction[]> });
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
      r.name.toLowerCase().includes(roleSearch.toLowerCase())
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
        className="mx-auto max-w-7xl space-y-6 p-6"
      >
        {/* Header */}
        <div className="
          flex flex-col gap-4
          sm:flex-row sm:items-center sm:justify-between
        "
        >
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Permission Management</h1>
              <Badge variant="outline" className="gap-1 text-xs">
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                {' '}
                API Connected (/api/v1/roles)
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure CRUD permissions for system roles fetched dynamically from the Roles API.
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
                    Reset
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
                  Save
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
            flex flex-col h-[600px]
          "
          >
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-base">Roles</CardTitle>
              <CardDescription className="text-xs">
                {isRolesLoading ? 'Loading...' : `Select a role (${fetchedRoles.length})`}
              </CardDescription>
              <div className="relative mt-2">
                <Search className="
                  absolute left-2.5 top-2.5 size-4 text-muted-foreground
                "
                />
                <Input
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Search role..."
                  className="h-9 pl-9 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent className="p-2 flex-1 overflow-y-auto space-y-1.5">
              {filteredRoles.map((role) => {
                const isSelected = role.id === selectedRole.id;
                const isCurrent = role.name === user.role;
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
                        {role.name}
                      </span>
                      {isCurrent && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 shrink-0"
                        >
                          Current
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
            flex flex-col h-[600px]
          "
          >
            <CardHeader className="
              p-4 border-b flex flex-row items-center justify-between space-y-0
            "
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  {selectedRole.name === 'user'
                    ? <UserCheck className="size-5" />
                    : (
                      <Lock className="size-5" />
                    )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{selectedRole.name}</CardTitle>
                    <span className="
                      text-xs font-mono bg-muted px-2 py-0.5 rounded-sm
                    "
                    >
                      {selectedRole.id}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <permissionForm.Subscribe selector={(state) => state.values.permissions}>
              {(currentPermissions = {}) => (
                <CardContent className="p-4 flex-1 overflow-y-auto space-y-4">
                  {RESOURCES.map((resource) => (
                    <ResourcePermissionCard
                      key={resource.key}
                      resource={resource}
                      activeCrud={(currentPermissions)[resource.key] || []}
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
