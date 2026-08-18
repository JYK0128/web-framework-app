import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { Activity, Bell, FileText, HelpCircle, Loader2, Lock, MessageCircleQuestion, RotateCcw, Save, Search, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getRolesControllerGetRolesQueryKey, useRolesControllerGetRoles, useRolesControllerUpdateRolePermissions } from '#/.generated/api/endpoints/roles/roles';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Switch } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { hasPermission } from '#/core/auth/permissions';

export type CrudAction = 'create' | 'read' | 'update' | 'delete';

const CRUD_ACTIONS: readonly CrudAction[] = ['create', 'read', 'update', 'delete'];

const RESOURCES = [
  { key: 'term', icon: FileText },
  { key: 'notice', icon: Bell },
  { key: 'faq', icon: HelpCircle },
  { key: 'role', icon: Lock },
  { key: 'user', icon: Users },
  { key: 'inquiry', icon: MessageCircleQuestion },
  { key: 'activityLog', icon: Activity },
] as const;

export const Route = createFileRoute('/_protected/_app/permission/')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'role:manage')) {
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
    <Card size="sm" className="shadow-2xs">
      <CardHeader className="
        flex flex-row items-center justify-between border-b pb-2.5 space-y-0
      "
      >
        <div className="flex items-center gap-2">
          <div className="
            flex size-7 items-center justify-center rounded-md bg-primary/10
            text-primary
          "
          >
            <ResourceIcon className="size-3.5" />
          </div>
          <CardTitle className="text-sm font-semibold text-foreground">
            {t(`permission.resources.${resource.key}`)}
          </CardTitle>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor={`all-crud-${resource.key}`}
            className="
              cursor-pointer select-none text-xs font-medium
              text-muted-foreground
            "
          >
            {t('permission.allCrud')}
          </label>
          <Switch
            id={`all-crud-${resource.key}`}
            checked={isAllSelected}
            onCheckedChange={() => onToggleAllCrud(resource.key)}
          />
        </div>
      </CardHeader>

      <CardContent className="
        grid grid-cols-2 gap-2
        sm:grid-cols-4
        pt-1
      "
      >
        {CRUD_ACTIONS.map((action) => {
          const isChecked = activeCrud.includes(action);
          return (
            <div
              key={action}
              role="button"
              tabIndex={0}
              onClick={() => onToggleCrud(resource.key, action)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleCrud(resource.key, action);
                }
              }}
              className={`
                flex items-center justify-between rounded-md border px-2.5 py-2
                text-xs cursor-pointer select-none transition-all
                ${isChecked
              ? `
                border-primary/50 bg-primary/10 font-semibold text-primary
                shadow-2xs
              `
              : `
                border-border/60 bg-muted/20 text-muted-foreground
                hover:border-border hover:bg-muted/50 hover:text-foreground
              `}
              `}
            >
              <span className="capitalize">{t(`permission.actions.${action}`)}</span>
              <Switch
                checked={isChecked}
                onCheckedChange={() => onToggleCrud(resource.key, action)}
                className="ml-1.5 shrink-0 pointer-events-none"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
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
      r.name.toLowerCase().includes(roleSearch.toLowerCase())
      || r.id.toLowerCase().includes(roleSearch.toLowerCase()),
  );

  return (
    <permissionForm.AppForm>
      <FormLayout
        onSubmit={() => void permissionForm.handleSubmit()}
        className="
          mx-auto grid size-full max-w-7xl grid-rows-[auto_1fr] gap-6
          overflow-hidden p-6
        "
      >
        {/* Header */}
        <div className="
          flex flex-col gap-3 shrink-0
          sm:flex-row sm:items-center sm:justify-between
        "
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="
                flex size-9 items-center justify-center rounded-lg bg-primary/10
                text-primary shadow-xs
              "
              >
                <Lock className="size-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t('permission.title')}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('permission.description')}
            </p>
          </div>

          <permissionForm.Subscribe selector={(state) => [state.isSubmitting, state.isDirty] as const}>
            {([isSubmitting, isDirty]) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => permissionForm.reset()}
                  disabled={!isDirty || isSubmitting}
                  className="gap-2"
                >
                  <RotateCcw className="size-4" />
                  {' '}
                  {t('permission.reset')}
                </Button>
                <Button
                  type="submit"
                  disabled={!isDirty || isSubmitting}
                  className="gap-2 shadow-xs"
                >
                  {isSubmitting
                    ? <Loader2 className="size-4 animate-spin" />
                    : <Save className="size-4" />}
                  {' '}
                  {t('permission.save')}
                </Button>
              </div>
            )}
          </permissionForm.Subscribe>
        </div>

        {/* Main Grid: 2 Columns on Desktop */}
        <div className="
          grid min-h-0 grid-cols-1 gap-6 overflow-y-auto p-px
          lg:grid-cols-12 lg:overflow-hidden
        "
        >
          {/* Left Column: Role Selection Card */}
          <Card className="
            grid min-h-0 grid-rows-[auto_1fr] overflow-hidden shadow-xs py-0
            gap-0 min-w-0
            lg:col-span-4
          "
          >
            <CardHeader className="p-4 border-b shrink-0 space-y-2">
              <div>
                <CardTitle className="text-base font-semibold">{t('permission.roles')}</CardTitle>
                <CardDescription className="text-xs">
                  {isRolesLoading ? t('permission.loading') : t('permission.selectRole', { count: fetchedRoles.length })}
                </CardDescription>
              </div>
              <div className="relative">
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
            <CardContent className="min-h-0 scroll-y p-3">
              <div className="flex flex-col gap-1.5">
                {filteredRoles.map((role) => {
                  const isSelected = role.id === selectedRole.id;
                  const isCurrent = role.name === user.role;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`
                        flex w-full items-center justify-between rounded-lg
                        border px-3.5 py-2.5 text-left text-xs transition-all
                        ${isSelected
                      ? `
                        border-primary bg-primary/10 font-semibold
                        text-foreground shadow-2xs ring-1 ring-primary/30
                      `
                      : `
                        border-border/60 bg-card text-muted-foreground
                        hover:border-border hover:bg-accent/50
                        hover:text-foreground
                      `}
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ShieldCheck className={`
                          size-4 shrink-0
                          ${isSelected
                      ? `text-primary`
                      : `text-muted-foreground`}
                        `}
                        />
                        <span className="truncate font-medium">{role.name}</span>
                      </div>
                      {isCurrent && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 shrink-0 font-normal"
                        >
                          {t('permission.current')}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Permission Matrix Card */}
          <Card className="
            grid min-h-0 grid-rows-[auto_1fr] overflow-hidden shadow-xs py-0
            gap-0 min-w-0
            lg:col-span-8
          "
          >
            <CardHeader className="
              p-4 border-b shrink-0 flex flex-row items-center justify-between
              space-y-0
            "
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {selectedRole.name === 'user'
                    ? <UserCheck className="size-5" />
                    : <Lock className="size-5" />}
                </div>
                <div>
                  <CardTitle className="text-base font-semibold capitalize">{selectedRole.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedRole.name}
                    {' '}
                    역할의 리소스별 접근 및 조작 권한
                  </p>
                </div>
              </div>
            </CardHeader>

            <permissionForm.Subscribe selector={(state) => state.values.permissions}>
              {(currentPermissions = {}) => (
                <CardContent className="min-h-0 scroll-y p-4 space-y-3.5">
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
      </FormLayout>
    </permissionForm.AppForm>
  );
}
