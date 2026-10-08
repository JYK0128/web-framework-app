import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';

import { getAuthControllerMeV1QueryKey, useAuthControllerChangePasswordV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerChangePasswordV1Body } from '#/.generated/api/zod/auth/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';
import { describePasswordPolicy, getPasswordPolicyError } from '#/lib/password-policy';

export const Route = createFileRoute('/_protected/_global/onboarding/change-password')({
  validateSearch: z.object({ callback: z.string().optional() }),
  component: ChangePasswordOnboardingPage,
});

function ChangePasswordOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const policy = SERVICE_AUTH_POLICY_CONFIG;
  const mutation = useAuthControllerChangePasswordV1();
  const form = useAppForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validators: {
      onSubmit: AuthControllerChangePasswordV1Body.superRefine((value, context) => {
        const passwordError = getPasswordPolicyError(value.newPassword, policy);
        if (passwordError) context.addIssue({ code: 'custom', path: ['newPassword'], message: passwordError });
        if (value.newPassword !== value.confirmPassword) {
          context.addIssue({ code: 'custom', path: ['confirmPassword'], message: '새 비밀번호가 일치하지 않습니다.' });
        }
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync({ data: value });
        await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
        await router.invalidate();
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) {
          form.setErrorMap({ onSubmit: { fields: getValidationFieldErrors(error.details) } });
        }
      }
    },
  });

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full max-w-md shadow-xl border border-border/40">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">비밀번호 변경</CardTitle>
            <CardDescription>비밀번호가 만료됐습니다. 새 비밀번호를 설정해 계속 이용해 주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form.AppForm>
              <FormLayout
                id="change-password-onboarding-form"
                onSubmit={() => void form.handleSubmit()}
                className="gap-4"
              >
                <p className="text-sm text-muted-foreground">{describePasswordPolicy(policy)}</p>
                <form.AppField name="currentPassword">{(field) => <field.Input type="password" label="현재 비밀번호" autoComplete="current-password" required />}</form.AppField>
                <form.AppField name="newPassword">{(field) => <field.Input type="password" label="새 비밀번호" minLength={policy.passwordMinLength} maxLength={policy.passwordMaxLength} autoComplete="new-password" required />}</form.AppField>
                <form.AppField name="confirmPassword">{(field) => <field.Input type="password" label="새 비밀번호 확인" autoComplete="new-password" required />}</form.AppField>
                <FormSubmit className="w-full" disabled={mutation.isPending}>{mutation.isPending ? '변경 중...' : '비밀번호 변경'}</FormSubmit>
              </FormLayout>
            </form.AppForm>
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
