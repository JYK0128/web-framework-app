import { z } from '@pkg/shared/common';

import { usePermissionsControllerGetPermissionsV1 } from '#/.generated/api/endpoints/permissions/permissions';
import { useRolesControllerCreateRoleV1, useRolesControllerUpdateRoleV1 } from '#/.generated/api/endpoints/roles/roles';
import type { PermissionItemDto, RoleItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

export type RoleEditorProps = ModalComponentProps<boolean> & {
  role?: RoleItemDto
  PermissionMatrix: React.ComponentType<{
    permissionItems: PermissionItemDto[]
    isLoading: boolean
    isError: boolean
  }>
};

export function RoleEditor({ role, open, onOpenChange, close, PermissionMatrix }: RoleEditorProps) {
  const permissionsQuery = usePermissionsControllerGetPermissionsV1();
  const create = useRolesControllerCreateRoleV1();
  const update = useRolesControllerUpdateRoleV1();
  const pending = create.isPending || update.isPending;
  const form = useAppForm({
    defaultValues: {
      code: role?.code ?? '',
      label: role?.label ?? '',
      description: role?.description ?? '',
      permissions: role?.permissions ?? [],
    },
    validators: {
      onSubmit: z.object({
        code: z.string().trim().min(1, '역할 코드를 입력해 주세요.'),
        label: z.string().trim().min(1, '역할 이름을 입력해 주세요.'),
        description: z.string(),
        permissions: z.array(z.string()),
      }),
    },
    onSubmit: async ({ value: submittedValue }) => {
      const value = submittedValue;
      const data = { label: value.label.trim(), description: value.description.trim(), permissions: value.permissions };
      if (role) await update.mutateAsync({ id: role.id, data });
      else await create.mutateAsync({ data: { code: value.code.trim().toLowerCase(), ...data } });
      close?.(true);
    },
  });

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange?.(nextOpen);
        if (!nextOpen && !pending) close?.(false);
      }}
    >
      <Modal.Content
        size="xl"
        className="
          max-h-[calc(100vh-2rem)]
          sm:max-w-3xl
          grid-rows-[auto_minmax(0,1fr)_auto]
        "
      >
        <Modal.Header>
          <Modal.Title>{role ? '역할 수정' : '역할 추가'}</Modal.Title>
          <Modal.Description>관리자에게 부여할 역할과 권한을 설정합니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <FormLayout
            onSubmit={() => void form.handleSubmit()}
            className="grid gap-4 py-2 pr-1"
          >
            <form.AppField name="code">
              {(field) => <field.Input label="역할 코드" disabled={Boolean(role)} placeholder="예: content_manager" required />}
            </form.AppField>
            <form.AppField name="label">
              {(field) => <field.Input label="역할 이름" placeholder="예: 콘텐츠 관리자" required />}
            </form.AppField>
            <form.AppField name="description">
              {(field) => <field.Textarea label="설명" placeholder="역할 설명을 입력해 주세요." rows={2} />}
            </form.AppField>
            <form.AppField name="permissions">
              {() => <PermissionMatrix permissionItems={permissionsQuery.data?.data.items ?? []} isLoading={permissionsQuery.isLoading} isError={permissionsQuery.isError} />}
            </form.AppField>
            <Modal.Footer>
              <Button type="button" variant="outline" disabled={pending} onClick={() => close?.(false)}>취소</Button>
              <form.Submit disabled={pending || permissionsQuery.isLoading || permissionsQuery.isError}>{pending ? '저장 중...' : '저장'}</form.Submit>
            </Modal.Footer>
          </FormLayout>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
