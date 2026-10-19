import { ApplicationError, getValidationFieldErrors } from '@pkg/shared/common';
import { assertPasswordPolicy, SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { FormLayout, FormSubmit, useAppForm } from '@pkg/web-core/form';
import { useI18n } from '@pkg/web-core/i18n';
import { Modal, type ModalComponentProps } from '@pkg/web-core/modal';
import { Button } from '@pkg/web-core/ui';

import { useAuthControllerChangePasswordV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerChangePasswordV1Body } from '#/.generated/api/zod/auth/auth';

export function ProfileChangePasswordModal({ open, onOpenChange, close }: ModalComponentProps<boolean>) {
  const { t, i18n } = useI18n();
  const policy = SERVICE_AUTH_POLICY_CONFIG;
  const mutation = useAuthControllerChangePasswordV1();
  const form = useAppForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validators: {
      onSubmit: AuthControllerChangePasswordV1Body
        .superRefine((value, context) => {
          try {
            assertPasswordPolicy(value.newPassword, policy);
          }
          catch (error) {
            if (!(error instanceof ApplicationError)) throw error;
            const message = error.translate(i18n);
            context.addIssue({ code: 'custom', path: ['newPassword'], message });
          }
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
      <Modal.Content
        size="md"
        className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)]"
      >
        <Modal.Header>
          <Modal.Title>비밀번호 변경</Modal.Title>
          <Modal.Description>현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <FormLayout
            onSubmit={() => void form.handleSubmit()}
            className="
              grid grid-rows-[minmax(0,1fr)_auto] overflow-hidden gap-4
            "
          >
            <Modal.Body className="scroll-y grid content-start gap-4 py-2 pr-1">
              <p className="text-sm text-muted-foreground">
                {t('passwordPolicy.description', {
                  minLength: policy.passwordMinLength,
                  maxLength: policy.passwordMaxLength,
                })}
                {(policy.passwordRequiresNumbers || policy.passwordRequiresSpecialChar || policy.passwordRequiresUppercase) && (
                  <>
                    {' '}
                    {t('passwordPolicy.requirements', {
                      requirements: [
                        policy.passwordRequiresNumbers && t('passwordPolicy.number'),
                        policy.passwordRequiresSpecialChar && t('passwordPolicy.specialCharacter'),
                        policy.passwordRequiresUppercase && t('passwordPolicy.uppercase'),
                      ].filter((requirement): requirement is string => typeof requirement === 'string').join(', '),
                    })}
                  </>
                )}
              </p>
              <form.AppField name="currentPassword">{(field) => <field.Input type="password" label="현재 비밀번호" placeholder="현재 비밀번호를 입력해 주세요." autoComplete="current-password" required />}</form.AppField>
              <form.AppField name="newPassword">{(field) => <field.Input type="password" label="새 비밀번호" placeholder="새 비밀번호를 입력해 주세요." minLength={policy.passwordMinLength} maxLength={policy.passwordMaxLength} autoComplete="new-password" required />}</form.AppField>
              <form.AppField name="confirmPassword">{(field) => <field.Input type="password" label="새 비밀번호 확인" placeholder="새 비밀번호를 다시 입력해 주세요." autoComplete="new-password" required />}</form.AppField>
            </Modal.Body>
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
