import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { Copy, Loader2, Lock, Plus, RotateCcw, Save, Search, ShieldCheck, Trash2, Users } from 'lucide-react';
import type { IconName } from 'lucide-react/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useResourcesControllerGetResources } from '#/.generated/api/endpoints/resources/resources';
import { getRolesControllerGetRolesQueryKey, useRolesControllerDeleteRole, useRolesControllerGetRoles, useRolesControllerUpdateRolePermissions } from '#/.generated/api/endpoints/roles/roles';
import type { ResourceDto, RoleDto } from '#/.generated/api/model';
import { Badge, Button, Input, Switch } from '#/.generated/shadcn/components/ui';
import { ActionCard, openDialog, PageSection, SectionCard } from '#/components/app';
import { confirm } from '#/components/app/system-dialog';
import { FormLayout, useAppForm } from '#/components/form';
import { hasPermission } from '#/core/auth/permissions';
import { useI18n } from '#/hooks';

import { RoleCreateDialog } from './-components/role-create-dialog';
import { CATEGORY_LABELS, toggleAllCrudActions, toggleCrudAction } from './-configs/permission.config';

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
  const fetchedRoles: RoleDto[] = useMemo(() => rolesData?.roles ?? [], [rolesData?.roles]);

  const { data: resourcesData, isLoading: isResourcesLoading } = useResourcesControllerGetResources();
  const fetchedResources: ResourceDto[] = useMemo(() => resourcesData?.resources ?? [], [resourcesData?.resources]);

  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  const defaultRoleId = fetchedRoles.find((role) => role.name === user.role)?.id ?? fetchedRoles[0]?.id ?? '';
  const selectedRole = fetchedRoles.find((role) => role.id === (selectedRoleId || defaultRoleId)) ?? {
    id: '',
    name: '',
    label: '',
    description: '',
    isSystem: false,
    permissions: {},
    userCount: 0,
  };

  const updatePermissionsMutation = useRolesControllerUpdateRolePermissions({
    mutation: {
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: getRolesControllerGetRolesQueryKey() }),
    },
  });

  const deleteRoleMutation = useRolesControllerDeleteRole({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getRolesControllerGetRolesQueryKey() });
        setSelectedRoleId('');
      },
    },
  });

  const permissionForm = useAppForm({
    defaultValues: { permissions: selectedRole.permissions || {} },
    onSubmit: async ({ value }) => {
      if (selectedRole.id) {
        await updatePermissionsMutation.mutateAsync({
          id: selectedRole.id,
          data: { permissions: value.permissions },
        });
      }
    },
  });

  useEffect(() => {
    if (selectedRole.id) permissionForm.reset({ permissions: selectedRole.permissions || {} });
  }, [permissionForm, selectedRole.id, selectedRole.permissions]);

  const filteredRoles = fetchedRoles.filter(
    (role) =>
      role.name.toLowerCase().includes(roleSearch.toLowerCase())
      || (role.label && role.label.toLowerCase().includes(roleSearch.toLowerCase()))
      || role.id.toLowerCase().includes(roleSearch.toLowerCase()),
  );

  // 리소스를 카테고리별로 그룹화
  const groupedResources = useMemo(() => {
    const groups: Record<string, ResourceDto[]> = {};
    for (const r of fetchedResources) {
      const cat = r.category || 'general';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    }
    return groups;
  }, [fetchedResources]);

  const handleToggleCrudPermission = (resourceKey: string, action: string) => {
    const current = permissionForm.getFieldValue('permissions') || {};
    permissionForm.setFieldValue('permissions', toggleCrudAction(current, resourceKey, action));
  };

  const handleToggleAllResourceCrud = (resourceKey: string, availableActions: string[]) => {
    const current = permissionForm.getFieldValue('permissions') || {};
    permissionForm.setFieldValue('permissions', toggleAllCrudActions(current, resourceKey, availableActions));
  };

  const handleOpenCreate = useCallback(async () => {
    const newId = await openDialog(RoleCreateDialog, {
      existingRoles: fetchedRoles,
      copyFromRole: null,
    }, { dialogId: 'role-create' });
    if (newId) setSelectedRoleId(newId);
  }, [fetchedRoles]);

  const handleOpenDuplicate = useCallback(async (role: RoleDto, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = await openDialog(RoleCreateDialog, {
      existingRoles: fetchedRoles,
      copyFromRole: role,
    }, { dialogId: `role-copy-${role.id}` });
    if (newId) setSelectedRoleId(newId);
  }, [fetchedRoles]);

  const handleDeleteRole = async (role: RoleDto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (role.isSystem) return;

    if (role.userCount > 0) {
      await confirm({
        title: '역할 삭제 불가',
        description: `현재 '${role.label || role.name}' 역할을 사용 중인 회원이 ${role.userCount}명 있어 삭제할 수 없습니다. 먼저 회원 관리에서 역할을 재배정해주세요.`,
        tone: 'danger',
      });
      return;
    }

    const isConfirmed = await confirm({
      title: '역할 삭제',
      description: `'${role.label || role.name}' (${role.name}) 역할을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      tone: 'danger',
    });

    if (isConfirmed) {
      await deleteRoleMutation.mutateAsync({ id: role.id });
    }
  };

  return (
    <>
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
                grid grid-cols-[20rem_minmax(0,1fr)] gap-6 overflow-hidden
              "
              >
                <SectionCard
                  textSize="sm"
                  title={t('permission.roles')}
                  description={isRolesLoading ? t('permission.loading') : t('permission.selectRole', { count: fetchedRoles.length })}
                >
                  <SectionCard.Actions>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleOpenCreate()}
                      className="h-8 gap-1.5 text-xs font-semibold"
                    >
                      <Plus className="size-3.5" />
                      <span>역할 추가</span>
                    </Button>
                  </SectionCard.Actions>

                  <div className="p-2 border-b">
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
                        className="h-8.5 pl-8 text-xs"
                      />
                    </div>
                  </div>

                  <SectionCard.Content className="scroll-y">
                    <div className="flex flex-col gap-1.5">
                      {filteredRoles.map((role) => {
                        const isSelected = role.id === selectedRole.id;
                        const isCurrent = role.name === user.role;
                        return (
                          <div
                            key={role.id}
                            onClick={() => setSelectedRoleId(role.id)}
                            className={`
                              group flex w-full items-center justify-between
                              rounded-lg border p-2.5 text-left text-xs
                              transition-all cursor-pointer
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
                            <div className="
                              flex items-center gap-2.5 min-w-0 flex-1
                            "
                            >
                              {role.isSystem
                                ? (
                                  <span title="시스템 필수 역할">
                                    <Lock
                                      className="
                                        size-4 shrink-0 text-muted-foreground
                                      "
                                    />
                                  </span>
                                )
                                : (
                                  <ShieldCheck className={`
                                    size-4 shrink-0
                                    ${isSelected
                                    ? `text-primary`
                                    : `text-muted-foreground`}
                                  `}
                                  />
                                )}
                              <div className="grid gap-0.5 truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="
                                    truncate font-semibold text-foreground
                                  "
                                  >
                                    {role.label || role.name}
                                  </span>
                                  {role.isSystem && (
                                    <Badge
                                      variant="outline"
                                      className="
                                        text-[10px] px-1 py-0 h-4
                                        border-muted-foreground/40
                                        text-muted-foreground
                                      "
                                    >
                                      시스템
                                    </Badge>
                                  )}
                                  {isCurrent && (
                                    <Badge
                                      variant="secondary"
                                      className="
                                        text-[10px] px-1 py-0 h-4 shrink-0
                                        font-normal
                                      "
                                    >
                                      {t('permission.current')}
                                    </Badge>
                                  )}
                                </div>
                                <span className="
                                  font-mono text-[10px] text-muted-foreground
                                  truncate
                                "
                                >
                                  {role.name}
                                  {role.userCount > 0 && ` · ${role.userCount}명`}
                                </span>
                              </div>
                            </div>

                            <div className="
                              flex items-center gap-1 shrink-0 opacity-80
                              group-hover:opacity-100
                            "
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={(event) => void handleOpenDuplicate(role, event)}
                                title="이 역할의 권한을 복제하여 새 역할 만들기"
                              >
                                <Copy className="size-3.5" />
                              </Button>

                              {!role.isSystem && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={(e) => void handleDeleteRole(role, e)}
                                  title="역할 삭제"
                                  className="
                                    text-destructive/80
                                    hover:text-destructive
                                    hover:bg-destructive/10
                                  "
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard.Content>
                </SectionCard>

                <SectionCard
                  textSize="sm"
                  title={`${selectedRole.label || selectedRole.name} (${selectedRole.name})`}
                  description={selectedRole.description || `${selectedRole.label || selectedRole.name} 역할의 리소스별 접근 및 조작 권한`}
                >
                  <SectionCard.Actions>
                    {selectedRole.isSystem && (
                      <Badge variant="outline" className="text-xs">시스템 예약 역할</Badge>
                    )}
                    <div className="
                      flex items-center gap-2 text-xs text-muted-foreground
                    "
                    >
                      <Users className="size-4" />
                      <span>
                        소속 회원
                        {selectedRole.userCount ?? 0}
                        명
                      </span>
                    </div>
                  </SectionCard.Actions>

                  <SectionCard.Content className="
                    scroll-y flex flex-col gap-6 p-4 pb-12
                  "
                  >
                    {isResourcesLoading
                      ? (
                        <div className="
                          flex items-center justify-center p-8
                          text-muted-foreground gap-2
                        "
                        >
                          <Loader2 className="size-5 animate-spin" />
                          <span>리소스 목록을 불러오는 중...</span>
                        </div>
                      )
                      : (
                        <permissionForm.Subscribe selector={(state) => state.values.permissions}>
                          {(currentPermissions = {}) => (
                            <>
                              {Object.entries(groupedResources).map(([categoryKey, resources]) => {
                                const catInfo = CATEGORY_LABELS[categoryKey] || {
                                  label: categoryKey,
                                  description: '기능 권한',
                                };
                                return (
                                  <div
                                    key={categoryKey}
                                    className="flex flex-col gap-3"
                                  >
                                    <div className="border-b pb-1.5">
                                      <h4 className="
                                        text-xs font-bold text-foreground
                                      "
                                      >
                                        {catInfo.label}
                                      </h4>
                                      <p className="
                                        text-[11px] text-muted-foreground
                                      "
                                      >
                                        {catInfo.description}
                                      </p>
                                    </div>

                                    <div className="flex flex-col gap-2.5">
                                      {resources.map((resource) => (
                                        <ResourcePermissionCard
                                          key={resource.key}
                                          resource={resource}
                                          activeActions={(currentPermissions as Record<string, string[]>)[resource.key] || []}
                                          onToggleAction={handleToggleCrudPermission}
                                          onToggleAllActions={handleToggleAllResourceCrud}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </permissionForm.Subscribe>
                      )}
                  </SectionCard.Content>
                </SectionCard>
              </div>
            </PageSection.Content>
          </PageSection>
        </FormLayout>
      </permissionForm.AppForm>

    </>
  );
}

type ResourcePermissionCardProps = {
  resource: ResourceDto
  activeActions: string[]
  onToggleAction: (resourceKey: string, action: string) => void
  onToggleAllActions: (resourceKey: string, availableActions: string[]) => void
};

function ResourcePermissionCard({
  resource,
  activeActions,
  onToggleAction,
  onToggleAllActions,
}: ResourcePermissionCardProps) {
  const { t } = useI18n();
  const availableActions = resource.actions || ['create', 'read', 'update', 'delete'];
  const isAllSelected = availableActions.length > 0 && availableActions.every((action) => activeActions.includes(action));

  return (
    <ActionCard
      icon={(resource.icon as IconName) || 'shield'}
      title={`${resource.label} (${resource.key})`}
      description={resource.description ?? undefined}
    >
      <ActionCard.Actions>
        {/* Action Chips */}
        <div className="flex flex-wrap items-center gap-1">
          {availableActions.map((action) => {
            const isChecked = activeActions.includes(action);
            return (
              <button
                key={action}
                type="button"
                onClick={() => onToggleAction(resource.key, action)}
                className={`
                  group inline-flex items-center gap-1.5 rounded-md px-2 py-0.5
                  text-xs font-mono transition-all cursor-pointer border
                  select-none
                  ${isChecked
                ? `
                  border-primary/40 bg-primary/10 font-semibold text-primary
                  shadow-2xs
                  hover:bg-primary/15
                `
                : `
                  border-border/60 bg-muted/20 text-muted-foreground
                  hover:border-border hover:bg-muted/50 hover:text-foreground
                `
              }
                `}
              >
                <span
                  className={`
                    size-1.5 rounded-full transition-colors
                    ${isChecked
                ? 'bg-primary'
                : `
                  bg-muted-foreground/40
                  group-hover:bg-muted-foreground
                `}
                  `}
                />
                <span>{action}</span>
              </button>
            );
          })}
        </div>

        {/* Vertical Divider */}
        <div className="
          h-4 w-px bg-border/60 mx-1 hidden
          sm:block
        "
        />

        {/* All Toggle Switch */}
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          <label
            htmlFor={`all-crud-${resource.key}`}
            className="
              cursor-pointer select-none text-[11px] font-medium
              text-muted-foreground
              hover:text-foreground
            "
          >
            {t('permission.allCrud')}
          </label>
          <Switch
            id={`all-crud-${resource.key}`}
            checked={isAllSelected}
            onCheckedChange={() => onToggleAllActions(resource.key, availableActions)}
          />
        </div>
      </ActionCard.Actions>
    </ActionCard>
  );
}
