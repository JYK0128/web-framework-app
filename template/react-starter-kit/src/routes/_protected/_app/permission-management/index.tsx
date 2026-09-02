import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { Loader2, RotateCcw, Save, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getRolesControllerGetRolesQueryKey, useRolesControllerGetRoles, useRolesControllerUpdateRolePermissions } from '#/.generated/api/endpoints/roles/roles';
import { Badge, Button, Input, Switch } from '#/.generated/shadcn/components/ui';
import { PageSection, SectionCard } from '#/components/app';
import { FormLayout, useAppForm } from '#/components/form';
import { hasPermission } from '#/core/auth/permissions';
import { useI18n } from '#/hooks';

import { CRUD_ACTIONS, type CrudAction, type Resource, RESOURCES, toggleAllCrudActions, toggleCrudAction } from './-configs/permission.config';

export const Route = createFileRoute('/_protected/_app/permission-management/')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'role:manage')) {
      throw notFound({ routeId: Route.id });
    }
  },
  component: PermissionPageComponent,
});

function PermissionPageComponent() {
  const { t } = useI18n();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: rolesData, isLoading: isRolesLoading } = useRolesControllerGetRoles();
  const fetchedRoles = rolesData?.roles ?? [];
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const defaultRoleId = fetchedRoles.find((role) => role.name === user.role)?.id ?? fetchedRoles[0]?.id ?? '';
  const selectedRole = fetchedRoles.find((role) => role.id === (selectedRoleId || defaultRoleId)) ?? { id: '', name: '', permissions: {} };
  const updatePermissionsMutation = useRolesControllerUpdateRolePermissions({ mutation: { onSuccess: () => void queryClient.invalidateQueries({ queryKey: getRolesControllerGetRolesQueryKey() }) } });
  const permissionForm = useAppForm({
    defaultValues: { permissions: selectedRole.permissions || {} },
    onSubmit: async ({ value }) => {
      if (selectedRole.id) await updatePermissionsMutation.mutateAsync({ id: selectedRole.id, data: { permissions: value.permissions } });
    },
  });
  useEffect(() => {
    if (selectedRole.id) permissionForm.reset({ permissions: selectedRole.permissions || {} });
  }, [permissionForm, selectedRole.id, selectedRole.permissions]);
  const filteredRoles = fetchedRoles.filter((role) => role.name.toLowerCase().includes(roleSearch.toLowerCase()) || role.id.toLowerCase().includes(roleSearch.toLowerCase()));
  const handleToggleCrudPermission = (resourceKey: string, action: CrudAction) => {
    const current = permissionForm.getFieldValue('permissions') || {};
    permissionForm.setFieldValue('permissions', toggleCrudAction(current, resourceKey, action));
  };
  const handleToggleAllResourceCrud = (resourceKey: string) => {
    const current = permissionForm.getFieldValue('permissions') || {};
    permissionForm.setFieldValue('permissions', toggleAllCrudActions(current, resourceKey));
  };

  return (
    <permissionForm.AppForm>
      <FormLayout
        onSubmit={() => void permissionForm.handleSubmit()}
        className="size-full"
      >
        <PageSection icon="lock" title={t('permission.title')} description={t('permission.description')}>
          <PageSection.Actions>
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
          </PageSection.Actions>

          <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] p-2">
            <div className="
              grid grid-cols-[18rem_minmax(0,1fr)] gap-6 overflow-hidden
            "
            >
              <SectionCard
                textSize="sm"
                title={t('permission.roles')}
                description={isRolesLoading ? t('permission.loading') : t('permission.selectRole', { count: fetchedRoles.length })}
              >
                <SectionCard.Actions>
                  <div className="relative">
                    <Search className="
                      pointer-events-none absolute left-2.5 top-1/2 size-4
                      -translate-y-1/2 text-muted-foreground
                    "
                    />
                    <Input
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      placeholder={t('permission.searchRole')}
                      className="h-9 pl-8 text-xs"
                    />
                  </div>
                </SectionCard.Actions>
                <SectionCard.Content className="scroll-y">
                  <div className="flex flex-col gap-2">
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
                            border px-3 py-2.5 text-left text-xs transition-all
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
                          <div className="flex items-center gap-2.5">
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
                              className="text-[10px] shrink-0 font-normal"
                            >
                              {t('permission.current')}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </SectionCard.Content>
              </SectionCard>

              <SectionCard
                textSize="sm"
                title={selectedRole.name}
                description={`${selectedRole.name} 역할의 리소스별 접근 및 조작 권한`}
              >

                <SectionCard.Content className="
                  scroll-y grid grid-cols-1 auto-rows-max content-start gap-4
                "
                >
                  <permissionForm.Subscribe selector={(state) => state.values.permissions}>
                    {(currentPermissions = {}) => (
                      <>
                        {RESOURCES.map((resource) => (
                          <ResourcePermissionCard
                            key={resource.key}
                            resource={resource}
                            activeCrud={(currentPermissions as Record<string, CrudAction[]>)[resource.key] || []}
                            onToggleCrud={handleToggleCrudPermission}
                            onToggleAllCrud={handleToggleAllResourceCrud}
                          />
                        ))}
                      </>
                    )}
                  </permissionForm.Subscribe>
                </SectionCard.Content>
              </SectionCard>
            </div>
          </PageSection.Content>
        </PageSection>
      </FormLayout>
    </permissionForm.AppForm>
  );
}

type ResourcePermissionCardProps = {
  resource: Resource
  activeCrud: CrudAction[]
  onToggleCrud: (resourceKey: string, action: CrudAction) => void
  onToggleAllCrud: (resourceKey: string) => void
};

function ResourcePermissionCard({ resource, activeCrud, onToggleCrud, onToggleAllCrud }: ResourcePermissionCardProps) {
  const { t } = useI18n();
  const ResourceIcon = resource.icon;
  const isAllSelected = CRUD_ACTIONS.every((action) => activeCrud.includes(action));

  return (
    <SectionCard
      textSize="sm"
      className="h-fit grid-rows-[auto_auto]!"
      title={(
        <div className="flex items-center gap-2">
          <div className="
            flex size-7 items-center justify-center rounded-md bg-primary/10
            text-primary
          "
          >
            <ResourceIcon className="size-3.5" />
          </div>
          <div className="text-sm font-semibold text-foreground">
            {t(`permission.resources.${resource.key}`)}
          </div>
        </div>
      )}
    >
      <SectionCard.Actions>
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
          <Switch id={`all-crud-${resource.key}`} checked={isAllSelected} onCheckedChange={() => onToggleAllCrud(resource.key)} />
        </div>
      </SectionCard.Actions>
      <SectionCard.Content className="grid grid-cols-2 gap-2">
        {CRUD_ACTIONS.map((action) => {
          const isChecked = activeCrud.includes(action);
          return (
            <div
              key={action}
              role="button"
              tabIndex={0}
              onClick={() => onToggleCrud(resource.key, action)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onToggleCrud(resource.key, action);
                }
              }}
              className={`
                flex cursor-pointer select-none items-center justify-between
                rounded-md border p-3 text-xs transition-all
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
                className="pointer-events-none shrink-0"
              />
            </div>
          );
        })}
      </SectionCard.Content>
    </SectionCard>
  );
}
