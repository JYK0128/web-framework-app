import { z } from '@pkg/shared/common';

import { useAuthControllerChangePasswordV1, useAuthControllerGetPolicyV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';
import { describePasswordPolicy, getPasswordPolicyError } from '#/lib/password-policy';

export function ProfileChangePasswordModal({ open, onOpenChange, close }: ModalComponentProps<boolean>) {
  const policyQuery = useAuthControllerGetPolicyV1({ query: { enabled: open } });
  const mutation = useAuthControllerChangePasswordV1();
  const form = useAppForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validators: {
      onSubmit: z.object({ currentPassword: z.string(), newPassword: z.string(), confirmPassword: z.string() })
        .superRefine((value, context) => {
          const passwordError = getPasswordPolicyError(value.newPassword, policyQuery.data);
          if (passwordError) context.addIssue({ code: 'custom', path: ['newPassword'], message: passwordError });
          if (value.newPassword !== value.confirmPassword) {
            context.addIssue({ code: 'custom', path: ['confirmPassword'], message: '비밀번호가 일치하지 않습니다.' });
          }
        }),
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ data: value });
      close?.(true);
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
            <p className="text-sm text-muted-foreground">{describePasswordPolicy(policyQuery.data)}</p>
            {!policyQuery.data && (policyQuery.isError
              ? (
                <div className="grid gap-2">
                  <p role="alert" className="text-sm text-destructive">비밀번호 정책을 불러오지 못했습니다.</p>
                  <Button type="button" variant="outline" onClick={() => void policyQuery.refetch()}>정책 다시 불러오기</Button>
                </div>
              )
              : <p role="status" className="text-sm text-muted-foreground">비밀번호 정책을 확인하고 있습니다.</p>)}
            <form.AppField name="currentPassword">{(field) => <field.Input type="password" label="현재 비밀번호" placeholder="현재 비밀번호를 입력해 주세요." autoComplete="current-password" required />}</form.AppField>
            <form.AppField name="newPassword">{(field) => <field.Input type="password" label="새 비밀번호" placeholder="새 비밀번호를 입력해 주세요." minLength={policyQuery.data?.passwordMinLength} maxLength={policyQuery.data?.passwordMaxLength} autoComplete="new-password" required />}</form.AppField>
            <form.AppField name="confirmPassword">{(field) => <field.Input type="password" label="새 비밀번호 확인" placeholder="새 비밀번호를 다시 입력해 주세요." autoComplete="new-password" required />}</form.AppField>
            <Modal.Footer>
              <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => close?.(false)}>취소</Button>
              <FormSubmit disabled={mutation.isPending || !policyQuery.data}>변경</FormSubmit>
            </Modal.Footer>
          </FormLayout>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
