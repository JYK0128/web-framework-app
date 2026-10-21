import { ApplicationError, z } from '@pkg/shared/common';
import { ADMIN_AUTH_POLICY_CONFIG, assertPasswordPolicy } from '@pkg/shared/policy';
import { useI18n } from '@pkg/web-core/context/i18n';
import { FormLayout, FormSubmit, useAppForm } from '@pkg/web-core/form';
import { Modal, type ModalComponentProps } from '@pkg/web-core/modal';

import { useOperatorsControllerCreateOperatorV1 } from '~/.generated/api/endpoints/operators/operators';
import { useRolesControllerGetRolesV1 } from '~/.generated/api/endpoints/roles/roles';
import { OperatorsControllerCreateOperatorV1Body } from '~/.generated/api/zod/operators/operators';
import { Button } from '~/.generated/shadcn/components/ui';

type CreateOperatorModalProps = ModalComponentProps<boolean>;

export function CreateOperatorModal({ open, onOpenChange, close }: CreateOperatorModalProps) {
  const { t, i18n } = useI18n();
  const rolesQuery = useRolesControllerGetRolesV1({ query: { enabled: open } });
  const policy = ADMIN_AUTH_POLICY_CONFIG;
  const createMutation = useOperatorsControllerCreateOperatorV1({
    mutation: {
      onSuccess: () => close?.(true),
    },
  });

  const form = useAppForm({
    defaultValues: { name: '', email: '', password: '', role: 'admin' },
    validators: {
      onSubmit: OperatorsControllerCreateOperatorV1Body.extend({
        name: z.string().trim().min(1, '이름을 입력해 주세요.'),
        password: z.string(),
        role: z.string().min(1, '역할을 선택해 주세요.'),
      }).superRefine((value, context) => {
        try {
          assertPasswordPolicy(value.password, policy);
        }
        catch (error) {
          if (!(error instanceof ApplicationError)) throw error;
          const message = error.translate(i18n);
          context.addIssue({ code: 'custom', path: ['password'], message });
        }
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        await createMutation.mutateAsync({
          data: { name: value.name.trim(), email: value.email.trim(), password: value.password, role: value.role },
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
      <Modal.Content
        size="md"
        className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)]"
      >
        <Modal.Header>
          <Modal.Title>운영자 추가</Modal.Title>
          <Modal.Description>
            {policy.emailVerificationRequired
              ? '새 운영자 계정을 생성합니다. 로그인하려면 이메일 인증을 완료해야 합니다.'
              : '새 운영자 계정을 생성합니다.'}
          </Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <FormLayout
            onSubmit={() => void form.handleSubmit()}
            className="
              grid grid-rows-[minmax(0,1fr)_auto] overflow-hidden gap-4
            "
          >
            <Modal.Body className="scroll-y grid content-start gap-4 py-2 pr-1">
              <form.AppField name="name">
                {(field) => <field.Input label="이름" placeholder="운영자 이름" maxLength={120} autoComplete="name" required />}
              </form.AppField>
              <form.AppField name="email">
                {(field) => <field.Input type="email" label="이메일" placeholder="operator@example.com" maxLength={320} autoComplete="email" required />}
              </form.AppField>
              <form.AppField name="password">
                {(field) => <field.Input type="password" label="초기 비밀번호" minLength={policy.passwordMinLength} maxLength={policy.passwordMaxLength} autoComplete="new-password" required />}
              </form.AppField>
              <form.AppField name="role">
                {(field) => (
                  <field.Select
                    label="가입 역할"
                    placeholder="가입할 역할을 선택하세요"
                    options={(rolesQuery.data?.items ?? []).map((role) => ({ label: `${role.label || role.code} (${role.code})`, value: role.code }))}
                    disabled={rolesQuery.isLoading || rolesQuery.isError || createMutation.isPending}
                    required
                  />
                )}
              </form.AppField>
              {rolesQuery.isError && <p className="text-sm text-destructive">역할 목록을 불러오지 못했습니다.</p>}
              <Modal.Description className="text-xs text-muted-foreground">
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
              </Modal.Description>
            </Modal.Body>
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
