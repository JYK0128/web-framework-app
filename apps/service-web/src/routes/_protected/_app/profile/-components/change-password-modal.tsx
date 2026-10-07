import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/auth';
import { ApplicationError, getValidationFieldErrors } from '@pkg/shared/common';

import { useAuthControllerChangePasswordV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerChangePasswordV1Body } from '#/.generated/api/zod/auth/auth';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';
import { describePasswordPolicy, getPasswordPolicyError } from '#/lib/password-policy';

export function ProfileChangePasswordModal({ open, onOpenChange, close }: ModalComponentProps<boolean>) {
  const policy = SERVICE_AUTH_POLICY_CONFIG;
  const mutation = useAuthControllerChangePasswordV1();
  const form = useAppForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validators: {
      onSubmit: AuthControllerChangePasswordV1Body
        .superRefine((value, context) => {
          const passwordError = getPasswordPolicyError(value.newPassword, policy);
          if (passwordError) context.addIssue({ code: 'custom', path: ['newPassword'], message: passwordError });
          if (value.newPassword !== value.confirmPassword) {
            context.addIssue({ code: 'custom', path: ['confirmPassword'], message: '비밀번호가 일치하지 않습니다.' });
          }
        }),
    },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync({ data: value });
        close?.(true);
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) {
          form.setErrorMap({ onSubmit: { fields: getValidationFieldErrors(error.details) } });
        }
        else throw error;
      }
    },
  });

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="md">
        <Modal.Header>
          <Modal.Title>비밀번호 변경</Modal.Title>
          <Modal.Description>현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <FormLayout
            onSubmit={() => void form.handleSubmit()}
            className="grid gap-4"
          >
            <p className="text-sm text-muted-foreground">{describePasswordPolicy(policy)}</p>
            <form.AppField name="currentPassword">{(field) => <field.Input type="password" label="현재 비밀번호" placeholder="현재 비밀번호를 입력해 주세요." autoComplete="current-password" required />}</form.AppField>
            <form.AppField name="newPassword">{(field) => <field.Input type="password" label="새 비밀번호" placeholder="새 비밀번호를 입력해 주세요." minLength={policy.passwordMinLength} maxLength={policy.passwordMaxLength} autoComplete="new-password" required />}</form.AppField>
            <form.AppField name="confirmPassword">{(field) => <field.Input type="password" label="새 비밀번호 확인" placeholder="새 비밀번호를 다시 입력해 주세요." autoComplete="new-password" required />}</form.AppField>
            <Modal.Footer>
              <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => close?.(false)}>취소</Button>
              <FormSubmit disabled={mutation.isPending}>변경</FormSubmit>
            </Modal.Footer>
          </FormLayout>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
