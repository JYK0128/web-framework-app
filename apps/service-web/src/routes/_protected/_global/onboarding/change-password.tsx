import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { assertPasswordPolicy, SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { FormLayout, FormSubmit, useAppForm } from '@pkg/web-core/form';
import { useI18n } from '@pkg/web-core/i18n';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';

import { getAuthControllerMeV1QueryKey, useAuthControllerChangePasswordV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerChangePasswordV1Body } from '#/.generated/api/zod/auth/auth';

import { OnboardingLayout } from './-components/onboarding-layout';

export const Route = createFileRoute('/_protected/_global/onboarding/change-password')({
  validateSearch: z.object({ callback: z.string().optional() }),
  component: ChangePasswordOnboardingPage,
});

function ChangePasswordOnboardingPage() {
  const { t, i18n } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const policy = SERVICE_AUTH_POLICY_CONFIG;
  const mutation = useAuthControllerChangePasswordV1();
  const form = useAppForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validators: {
      onSubmit: AuthControllerChangePasswordV1Body.superRefine((value, context) => {
        try {
          assertPasswordPolicy(value.newPassword, policy);
        }
        catch (error) {
          if (!(error instanceof ApplicationError)) throw error;
          const message = error.translate(i18n);
          context.addIssue({ code: 'custom', path: ['newPassword'], message });
        }
        if (value.newPassword !== value.confirmPassword) context.addIssue({ code: 'custom', path: ['confirmPassword'], message: '새 비밀번호가 일치하지 않습니다.' });
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync({ data: value });
        await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
        await router.invalidate();
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) form.setErrorMap({ onSubmit: { fields: getValidationFieldErrors(error.details) } });
      }
    },
  });

  return (
    <OnboardingLayout
      icon="lock-keyhole"
      title="비밀번호 변경"
      description="비밀번호가 만료됐습니다. 새 비밀번호를 설정해 계속 진행해 주세요."
      footer={<FormSubmit form="service-change-password-form" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? '변경 중...' : '비밀번호 변경'}</FormSubmit>}
    >
      <form.AppForm>
        <FormLayout
          id="service-change-password-form"
          onSubmit={() => void form.handleSubmit()}
          className="grid gap-4"
        >
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
          <form.AppField name="currentPassword">{(field) => <field.Input type="password" label="현재 비밀번호" autoComplete="current-password" required />}</form.AppField>
          <form.AppField name="newPassword">{(field) => <field.Input type="password" label="새 비밀번호" minLength={policy.passwordMinLength} maxLength={policy.passwordMaxLength} autoComplete="new-password" required />}</form.AppField>
          <form.AppField name="confirmPassword">{(field) => <field.Input type="password" label="새 비밀번호 확인" autoComplete="new-password" required />}</form.AppField>
        </FormLayout>
      </form.AppForm>
    </OnboardingLayout>
  );
}
