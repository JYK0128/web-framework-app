import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { usePermissionsControllerGetPermissionsV1 } from '#/.generated/api/endpoints/permissions/permissions';
import { getRolesControllerGetRolesV1QueryKey, useRolesControllerDeleteRoleV1, useRolesControllerGetRolesV1 } from '#/.generated/api/endpoints/roles/roles';
import type { PermissionItemDto, RoleItemDto } from '#/.generated/api/model';
import { Button, Checkbox, FieldLabel } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { useFieldContext } from '#/components/form/core/context';
import { PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';

import { RoleEditor } from '../-components/role-editor-modal';

export const Route = createFileRoute('/_protected/_app/role-management/')({ component: RoleManagementPage });

function PermissionMatrix({ permissionItems, isLoading, isError }: { permissionItems: PermissionItemDto[], isLoading: boolean, isError: boolean }) {
  const field = useFieldContext<string[]>();
  const permissions = field.state.value;
  const onChange = field.handleChange;
  const grouped = groupPermissions(permissionItems);
  const toggle = (permission: PermissionItemDto) => {
    onChange(permissions.includes(permission.code) ? permissions.filter((value) => value !== permission.code) : [...permissions, permission.code]);
  };
  const toggleResource = (items: PermissionItemDto[]) => {
    const codes = items.map((permission) => permission.code);
    const allSelected = codes.every((code) => permissions.includes(code));
    onChange(allSelected
      ? permissions.filter((permission) => !codes.includes(permission))
      : [...new Set([...permissions, ...codes])]);
  };
  return (
    <div className="scroll-y grid max-h-112 gap-4 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">리소스별 권한</p>
          <p className="text-xs text-muted-foreground">
            저장 버튼을 누를 때 선택한 권한이 한 번에 반영됩니다.
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          선택
          {permissions.length}
          개
        </span>
      </div>
      {Object.entries(grouped).map(([resource, items]) => {
        const basic = items.filter((permission) => ['read', 'create', 'update', 'delete'].includes(permission.action));
        const advanced = items.filter((permission) => !basic.includes(permission));
        const selectedCount = items.filter((permission) => permissions.includes(permission.code)).length;
        const allSelected = selectedCount === items.length;
        return (
          <div className="grid gap-2 border-t pt-3" key={resource}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{resource}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCount}
                  /
                  {items.length}
                  개 선택
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => toggleResource(items)}>{allSelected ? '전체 해제' : '전체 선택'}</Button>
            </div>
            <div className="
              grid grid-cols-2 gap-2
              sm:grid-cols-4
            "
            >
              {basic.map((permission) => <PermissionCheckbox key={permission.code} label={permission.label} code={permission.code} checked={permissions.includes(permission.code)} onChange={() => toggle(permission)} />)}
            </div>
            {advanced.length > 0 && (
              <div className="grid gap-2 rounded-md bg-muted/50 p-2">
                <p className="text-xs font-semibold text-muted-foreground">추가 권한</p>
                <div className="
                  grid grid-cols-2 gap-2
                  sm:grid-cols-3
                "
                >
                  {advanced.map((permission) => <PermissionCheckbox key={permission.code} label={permission.label} code={permission.code} checked={permissions.includes(permission.code)} onChange={() => toggle(permission)} />)}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {isLoading && <p className="text-sm text-muted-foreground">권한 목록을 불러오는 중...</p>}
      {!isLoading && permissionItems.length === 0 && (isError
        ? (
          <p className="text-sm text-destructive">
            권한 목록을 불러오지 못했습니다.
          </p>
        )
        : (
          <p className="text-sm text-muted-foreground">
            등록된 권한이 없습니다.
          </p>
        ))}
    </div>
  );
}

function PermissionSummary({ permissionItems, permissions, isLoading, isError }: { permissionItems: PermissionItemDto[], permissions: string[], isLoading: boolean, isError: boolean }) {
  const selectedItems = permissionItems.filter((permission) => permissions.includes(permission.code));
  const grouped = groupPermissions(selectedItems);

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-4">
      <div className="flex items-start justify-end gap-3">
        <span className="shrink-0 text-xs text-muted-foreground">
          {permissions.length}
          개
        </span>
      </div>
      <div className="scroll-y grid content-start gap-4 pr-1">
        {isLoading && <p className="text-sm text-muted-foreground">권한 목록을 불러오는 중...</p>}
        {!isLoading && isError && <p className="text-sm text-destructive">권한 목록을 불러오지 못했습니다.</p>}
        {!isLoading && !isError && selectedItems.length === 0 && (
          <p className="text-sm text-muted-foreground">
            등록된 권한이 없습니다.
          </p>
        )}
        {!isLoading && !isError && Object.entries(grouped).map(([resource, items]) => (
          <div className="grid gap-2 border-t pt-3" key={resource}>
            <p className="text-sm font-medium">{resource}</p>
            <div className="
              grid grid-cols-2 gap-2
              sm:grid-cols-4
            "
            >
              {items.map((permission) => (
                <div className="rounded-md border bg-muted/40 p-2" key={permission.code}>
                  <p className="text-sm font-medium">{permission.label}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{permission.code}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupPermissions(permissionItems: PermissionItemDto[]) {
  return permissionItems.reduce<Record<string, PermissionItemDto[]>>((result, permission) => {
    const resourcePermissions = result[permission.resource] ?? [];
    resourcePermissions.push(permission);
    result[permission.resource] = resourcePermissions;
    return result;
  }, {});
}

function PermissionCheckbox({ label, code, checked, onChange }: { label: string, code: string, checked: boolean, onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <FieldLabel>
        <span>
          <span className="block">{label}</span>
          <span className="block font-mono text-[10px] text-muted-foreground">
            {code}
          </span>
        </span>
      </FieldLabel>
    </label>
  );
}

function RoleManagementPage() {
  const queryClient = useQueryClient();
  const rolesQuery = useRolesControllerGetRolesV1();
  const permissionsQuery = usePermissionsControllerGetPermissionsV1();
  const [selectedId, setSelectedId] = useState<string>();
  const roles = useMemo(() => rolesQuery.data?.data.items ?? [], [rolesQuery.data?.data.items]);
  const selected = useMemo(() => roles.find((role) => role.id === selectedId) ?? roles[0], [roles, selectedId]);
  const remove = useRolesControllerDeleteRoleV1({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getRolesControllerGetRolesV1QueryKey() }) } });
  const openEditor = (role?: RoleItemDto) => {
    void openModal(RoleEditor, { role, PermissionMatrix }).then((saved) => {
      if (saved) void queryClient.invalidateQueries({ queryKey: getRolesControllerGetRolesV1QueryKey() });
    });
  };
  const deleteRole = async (role: RoleItemDto) => {
    if (role.isSystem || role.userCount > 0) return;
    if (await confirm({ title: '역할 삭제', description: `${role.label || role.code} 역할을 삭제하시겠습니까?`, tone: 'danger' })) remove.mutate({ id: role.id });
  };
  return (
    <PageSection icon="shield-check" title="역할 관리" description="관리자 역할과 역할별 권한을 관리합니다.">
      <PageSection.Content className="
        grid gap-4 p-2
          lg:grid-cols-[20rem_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]
      "
      >
        <SectionCard textSize="sm" title="역할 목록" description={`${roles.length}개의 역할`}>
          <SectionCard.Actions>
            <Button type="button" variant="outline" size="sm" onClick={() => openEditor()}>
              <Plus className="size-4" />
              역할 추가
            </Button>
          </SectionCard.Actions>
          <SectionCard.Content className="scroll-y grid gap-2 p-3">
            {rolesQuery.isLoading && <p className="p-3 text-sm text-muted-foreground">불러오는 중...</p>}
            {roles.map((role) => (
              <button
                type="button"
                key={role.id}
                onClick={() => setSelectedId(role.id)}
                className={`
                  grid gap-1 rounded-lg border p-3 text-left transition-colors
                  ${selected?.id === role.id ? `border-primary bg-primary/10` : `hover:bg-accent`}
                `}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="size-4 text-primary" />
                  {role.label || role.code}
                  {role.isSystem && <span className="text-[10px] font-normal text-muted-foreground">시스템</span>}
                </span>
                <span className="text-xs text-muted-foreground">
                  {role.code}
                  {' · 사용자 '}
                  {role.userCount}
                  명
                </span>
              </button>
            ))}
          </SectionCard.Content>
        </SectionCard>
        <SectionCard
          textSize="sm"
          title={selected ? `${selected.label || selected.code} (${selected.code})` : '역할을 선택하세요'}
          description={selected?.description || '역할 설명이 없습니다.'}
        >
          {selected && (
            <SectionCard.Actions>
              <Button type="button" variant="outline" size="sm" onClick={() => openEditor(selected)}>
                <Pencil className="size-4" />
                수정
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={selected.isSystem || selected.userCount > 0}
                onClick={() => void deleteRole(selected)}
              >
                <Trash2 className="size-4 text-destructive" />
                삭제
              </Button>
            </SectionCard.Actions>
          )}
          <SectionCard.Content className="overflow-hidden">
            {selected
              ? (
                <PermissionSummary
                  permissionItems={permissionsQuery.data?.data.items ?? []}
                  permissions={selected.permissions}
                  isLoading={permissionsQuery.isLoading}
                  isError={permissionsQuery.isError}
                />
              )
              : <p className="text-sm text-muted-foreground">왼쪽에서 역할을 선택하면 상세 권한이 표시됩니다.</p>}
          </SectionCard.Content>
        </SectionCard>
      </PageSection.Content>
    </PageSection>
  );
}
