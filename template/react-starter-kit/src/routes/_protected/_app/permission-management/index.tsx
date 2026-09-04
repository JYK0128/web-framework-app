import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { Copy, Lock, Pencil, Search, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { getResourcesControllerGetResourcesQueryKey, useResourcesControllerDeleteResource, useResourcesControllerGetResources } from '#/.generated/api/endpoints/resources/resources';
import { getRolesControllerGetRolesQueryKey, useRolesControllerDeleteRole, useRolesControllerGetRoles } from '#/.generated/api/endpoints/roles/roles';
import type { ResourceDto, RoleDto } from '#/.generated/api/model';
import { Badge, Button, Input } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { openDialog } from '#/components/dialog';
import { ActionCard, PageSection, SectionCard } from '#/components/layout';
import { hasPermission } from '#/core/auth/permissions';
import { useI18n } from '#/hooks';

import { ResourceCreateDialog } from './-components/resource-create-dialog';
import { ResourceEditDialog } from './-components/resource-edit-dialog';
import { RoleCreateDialog } from './-components/role-create-dialog';
import { RoleEditDialog } from './-components/role-edit-dialog';

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

  const { data: rolesData } = useRolesControllerGetRoles();
  const roles = useMemo<RoleDto[]>(() => rolesData?.roles ?? [], [rolesData?.roles]);

  const { data: resourcesData } = useResourcesControllerGetResources();
  const resources: ResourceDto[] = resourcesData?.resources ?? [];
  const deleteResourceMutation = useResourcesControllerDeleteResource({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getResourcesControllerGetResourcesQueryKey() }),
    },
  });

  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  const selectedRole = roles.find((role) => role.id === selectedRoleId)
    ?? roles.find((role) => role.key === user.role)
    ?? roles[0]
    ?? {
      id: '',
      key: '',
      label: '',
      description: '',
      isSystem: false,
      permissions: {},
      userCount: 0,
    };

  const deleteRoleMutation = useRolesControllerDeleteRole({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getRolesControllerGetRolesQueryKey() });
        setSelectedRoleId('');
      },
    },
  });

  const filteredRoles = roles.filter(
    (role) =>
      role.key.toLowerCase().includes(roleSearch.toLowerCase())
      || (role.label && role.label.toLowerCase().includes(roleSearch.toLowerCase()))
      || role.id.toLowerCase().includes(roleSearch.toLowerCase()),
  );

  const handleOpenCreate = useCallback(async () => {
    const newId = await openDialog(RoleCreateDialog, {
      existingRoles: roles,
      copyFromRole: null,
    }, { dialogId: 'role-create' });
    if (newId) setSelectedRoleId(newId);
  }, [roles]);

  const handleDeleteResource = useCallback(async (resource: ResourceDto) => {
    const isConfirmed = await confirm({
      title: '리소스 삭제',
      description: `'${resource.label}' (${resource.key}) 리소스를 삭제하시겠습니까? 역할에 저장된 해당 권한도 더 이상 적용되지 않습니다.`,
      tone: 'danger',
    });
    if (isConfirmed) await deleteResourceMutation.mutateAsync({ id: resource.id });
  }, [deleteResourceMutation]);

  const handleOpenDuplicate = useCallback(async (role: RoleDto, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = await openDialog(RoleCreateDialog, {
      existingRoles: roles,
      copyFromRole: role,
    }, { dialogId: `role-copy-${role.id}` });
    if (newId) setSelectedRoleId(newId);
  }, [roles]);

  const handleDeleteRole = async (role: RoleDto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (role.isSystem) return;

    if (role.userCount > 0) {
      await confirm({
        title: '역할 삭제 불가',
        description: `현재 '${role.label || role.key}' 역할을 사용 중인 회원이 ${role.userCount}명 있어 삭제할 수 없습니다. 먼저 회원 관리에서 역할을 재배정해주세요.`,
        tone: 'danger',
      });
      return;
    }

    const isConfirmed = await confirm({
      title: '역할 삭제',
      description: `'${role.label || role.key}' (${role.key}) 역할을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      tone: 'danger',
    });

    if (isConfirmed) {
      await deleteRoleMutation.mutateAsync({ id: role.id });
    }
  };

  return (
    <PageSection icon="lock" title={t('permission.title')} description={t('permission.description')}>
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] p-2">
        <div className="
          grid grid-cols-[20rem_minmax(0,1fr)] gap-6 overflow-hidden
        "
        >
          <SectionCard
            textSize="sm"
            title={t('permission.roles')}
            description={t('permission.selectRole', { count: roles.length })}
          >
            <SectionCard.Actions>
              <Button type="button" variant="outline" size="sm" onClick={() => void handleOpenCreate()}>역할 추가</Button>
            </SectionCard.Actions>
            <SectionCard.Content className="
              grid grid-rows-[auto_minmax(0,1fr)] p-0
            "
            >
              <div className="border-b p-2">
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

              <div className="scroll-y p-2">
                <div className="flex flex-col gap-1.5">
                  {filteredRoles.map((role) => {
                    const isSelected = role.id === selectedRole.id;
                    const isCurrent = role.key === user.role;
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
                        <div className="flex flex-1 items-center gap-2.5">
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
                                {role.label || role.key}
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
                              {role.key}
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
                            onClick={(event) => {
                              event.stopPropagation();
                              void openDialog(RoleEditDialog, { role }, { dialogId: `role-edit-${role.id}` });
                            }}
                            title="역할 수정"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
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
                                hover:text-destructive hover:bg-destructive/10
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
              </div>
            </SectionCard.Content>
          </SectionCard>

          <SectionCard
            textSize="sm"
            title={selectedRole.id
              ? `${selectedRole.label || selectedRole.key} (${selectedRole.key})`
              : ''}
            description={selectedRole.id
              ? selectedRole.description || `${selectedRole.label || selectedRole.key} 역할의 리소스별 접근 및 조작 권한`
              : undefined}
          >
            <SectionCard.Actions>
              <Button type="button" variant="outline" size="sm" onClick={() => void openDialog(ResourceCreateDialog, {}, { dialogId: 'resource-create' })}>리소스 추가</Button>
            </SectionCard.Actions>
            <SectionCard.Content className="
              scroll-y flex flex-col gap-6 p-4 pb-12
            "
            >
              <div className="flex items-center justify-end gap-2">
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
              </div>
              <div className="flex flex-col gap-2.5">
                {resources.map((resource) => (
                  <ActionCard
                    key={resource.key}
                    icon="shield"
                    title={`${resource.label} (${resource.key})`}
                    description={resource.description ?? undefined}
                  >
                    <ActionCard.Actions>
                      <Button
                        type="button"
                        onClick={() => void openDialog(ResourceEditDialog, { resource }, { dialogId: `resource-edit-${resource.id}` })}
                      >
                        수정
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => void handleDeleteResource(resource)}>
                        삭제
                      </Button>
                    </ActionCard.Actions>
                  </ActionCard>
                ))}
              </div>
            </SectionCard.Content>
          </SectionCard>
        </div>
      </PageSection.Content>
    </PageSection>
  );
}
