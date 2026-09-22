import { ApplicationError, z } from '@pkg/shared/common';

import { useRolesControllerGetRolesV1 } from '#/.generated/api/endpoints/roles/roles';
import { useUsersControllerCreateUserV1 } from '#/.generated/api/endpoints/users/users';
import { UsersControllerCreateUserV1Body } from '#/.generated/api/zod/users/users';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

type CreateAdminModalProps = ModalComponentProps<boolean>;
// This is the documented initial password for newly created administrators.
// eslint-disable-next-line sonarjs/no-hardcoded-passwords
const DEFAULT_ADMIN_PASSWORD = '1q2w3e4r1@';

export function CreateAdminModal({ open, onOpenChange, close }: CreateAdminModalProps) {
  const rolesQuery = useRolesControllerGetRolesV1({ query: { enabled: open } });
  const createMutation = useUsersControllerCreateUserV1({
    mutation: { onSuccess: () => close?.(true) },
  });

  const form = useAppForm({
    defaultValues: { name: '', email: '', role: 'admin' },
    validators: {
      onSubmit: UsersControllerCreateUserV1Body.omit({ password: true }).extend({
        name: z.string().trim().min(1, '이름을 입력해 주세요.'),
        role: z.string().min(1, '역할을 선택해 주세요.'),
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        await createMutation.mutateAsync({
          data: { name: value.name.trim(), email: value.email.trim(), password: DEFAULT_ADMIN_PASSWORD, role: value.role },
        });
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details && Array.isArray(error.details)) {
          const fields = Object.fromEntries(error.details.flatMap((detail: { property?: string, constraints?: Record<string, string> }) => {
            const message = detail.constraints && Object.values(detail.constraints)[0];
            return detail.property && message ? [[detail.property, message]] : [];
          }));
          form.setErrorMap({ onSubmit: { fields } });
        }
      }
    },
  });

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange?.(nextOpen);
        if (!nextOpen && !createMutation.isPending) close?.(false);
      }}
    >
      <Modal.Content size="md">
        <Modal.Header>
          <Modal.Title>관리자 추가</Modal.Title>
          <Modal.Description>새 관리자 계정을 생성합니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <FormLayout
            onSubmit={() => void form.handleSubmit()}
            className="grid gap-4 py-1"
          >
            <form.AppField name="name">
              {(field) => <field.Input label="이름" placeholder="관리자 이름" maxLength={120} autoComplete="name" required />}
            </form.AppField>
            <form.AppField name="email">
              {(field) => <field.Input type="email" label="이메일" placeholder="admin@example.com" maxLength={320} autoComplete="email" required />}
            </form.AppField>
            <form.AppField name="role">
              {(field) => (
                <field.Select
                  label="가입 역할"
                  placeholder="가입할 역할을 선택하세요"
                  options={(rolesQuery.data?.data.items ?? []).map((role) => ({ label: `${role.label || role.code} (${role.code})`, value: role.code }))}
                  disabled={rolesQuery.isLoading || rolesQuery.isError || createMutation.isPending}
                  required
                />
              )}
            </form.AppField>
            {rolesQuery.isError && <p className="text-sm text-destructive">역할 목록을 불러오지 못했습니다.</p>}
            <Modal.Description className="text-xs text-muted-foreground">
              기본 비밀번호는 1q2w3e4r1@로 설정됩니다.
            </Modal.Description>
            <Modal.Footer className="pt-2">
              <Button type="button" variant="outline" disabled={createMutation.isPending} onClick={() => close?.(false)}>취소</Button>
              <FormSubmit disabled={createMutation.isPending || rolesQuery.isLoading || rolesQuery.isError}>추가</FormSubmit>
            </Modal.Footer>
          </FormLayout>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
