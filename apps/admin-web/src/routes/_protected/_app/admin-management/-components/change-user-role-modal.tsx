import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';

import { useRolesControllerGetRolesV1 } from '#/.generated/api/endpoints/roles/roles';
import { getUsersControllerGetUsersV1QueryKey, useUsersControllerUpdateUserRoleV1 } from '#/.generated/api/endpoints/users/users';
import type { UserItemDto } from '#/.generated/api/model';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

type ChangeUserRoleModalProps = ModalComponentProps<boolean> & {
  user: UserItemDto
};

export function ChangeUserRoleModal({ user, open, onOpenChange, close }: ChangeUserRoleModalProps) {
  const queryClient = useQueryClient();
  const rolesQuery = useRolesControllerGetRolesV1({ query: { enabled: open } });
  const updateRoleMutation = useUsersControllerUpdateUserRoleV1();

  const roles = rolesQuery.data?.data.items ?? [];
  const form = useAppForm({
    defaultValues: { role: user.roleCode },
    validators: { onSubmit: z.object({ role: z.string().min(1, '역할을 선택해 주세요.') }) },
    onSubmit: async ({ value }) => {
      if (value.role === user.roleCode) return;
      await updateRoleMutation.mutateAsync({ id: user.id, data: { role: value.role } });
      await queryClient.invalidateQueries({ queryKey: getUsersControllerGetUsersV1QueryKey() });
      close?.(true);
    },
  });

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange?.(nextOpen);
        if (!nextOpen && !updateRoleMutation.isPending) close?.(false);
      }}
    >
      <Modal.Content size="md">
        <Modal.Header>
          <Modal.Title>역할 변경</Modal.Title>
          <Modal.Description>
            {user.name}
            {' 계정에 적용할 역할을 선택합니다.'}
          </Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <FormLayout
            onSubmit={() => void form.handleSubmit()}
            className="grid gap-4 py-2"
          >
            <form.AppField name="role">
              {(field) => (
                <field.Select
                  label="역할"
                  placeholder="역할을 선택하세요"
                  options={roles.map((role) => ({ label: `${role.label || role.code} (${role.code})`, value: role.code }))}
                  disabled={rolesQuery.isLoading || rolesQuery.isError || updateRoleMutation.isPending}
                  required
                />
              )}
            </form.AppField>
            {rolesQuery.isError && <p className="text-sm text-destructive">역할 목록을 불러오지 못했습니다.</p>}
            <Modal.Footer>
              <Button type="button" variant="outline" disabled={updateRoleMutation.isPending} onClick={() => close?.(false)}>취소</Button>
              <form.Submit disabled={rolesQuery.isLoading || rolesQuery.isError || updateRoleMutation.isPending}>
                {updateRoleMutation.isPending ? '저장 중...' : '저장'}
              </form.Submit>
            </Modal.Footer>
          </FormLayout>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
