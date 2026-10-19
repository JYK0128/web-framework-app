import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { ADMIN_AUTH_POLICY_CONFIG, assertPasswordPolicy } from '@pkg/shared/policy';
import { FormLayout, FormSubmit, useAppForm } from '@pkg/web-core/form';
import { useI18n } from '@pkg/web-core/i18n';
import { ScreenLayout } from '@pkg/web-core/template';
import { createFileRoute, Link } from '@tanstack/react-router';

import { useAuthControllerResetPasswordV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerResetPasswordV1Body } from '#/.generated/api/zod/auth/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';

export const Route = createFileRoute('/_public/_global/reset-password')({
  validateSearch: z.object({ challengeId: z.string().optional(), token: z.string().optional() }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t, i18n } = useI18n();
  const { challengeId = '', token = '' } = Route.useSearch();
  const policy = ADMIN_AUTH_POLICY_CONFIG;
  const mutation = useAuthControllerResetPasswordV1();
  const form = useAppForm({
    defaultValues: { newPassword: '', confirmPassword: '' },
    validators: {
      onSubmit: AuthControllerResetPasswordV1Body.pick({ newPassword: true }).extend({ newPassword: z.string(), confirmPassword: z.string() })
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
            context.addIssue({ code: 'custom', path: ['confirmPassword'], message: t('app.auth.resetPassword.passwordMismatch') });
          }
        }),
    },
    onSubmit: async ({ value }) => {
      try {
        await mutation.mutateAsync({ data: { challengeId, token, newPassword: value.newPassword } });
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) {
          form.setErrorMap({ onSubmit: { fields: getValidationFieldErrors(error.details) } });
        }
        else {
          throw error;
        }
      }
    },
  });

  return (
    <ScreenLayout.Root>
      <ScreenLayout.Content size="md">
        <Card className="
          grid size-full grid-rows-[auto_minmax(0,1fr)] shadow-xl border
          border-border/40
        "
        >
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">{t('app.auth.resetPassword.title')}</CardTitle>
            <CardDescription>{t('app.auth.resetPassword.description')}</CardDescription>
          </CardHeader>
          <CardContent className="scroll-y">
            {mutation.isSuccess
              ? (
                <div className="grid gap-4">
                  <p className="text-sm">{t('app.auth.resetPassword.success')}</p>
                  <Link
                    to="/login"
                    className="text-sm underline underline-offset-4"
                  >
                    {t('app.auth.resetPassword.login')}
                  </Link>
                </div>
              )
              : (
                <form.AppForm>
                  <FormLayout
                    id="reset-password-form"
                    onSubmit={() => void form.handleSubmit()}
                    className="gap-4"
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
                    {(!challengeId || !token) && (
                      <p
                        role="alert"
                        className="text-sm text-destructive"
                      >
                        {t('app.auth.resetPassword.missingInfo')}
                      </p>
                    )}
                    <form.AppField name="newPassword">{(field) => <field.Input type="password" label={t('app.auth.resetPassword.newPassword')} minLength={policy.passwordMinLength} maxLength={policy.passwordMaxLength} autoComplete="new-password" required />}</form.AppField>
                    <form.AppField name="confirmPassword">{(field) => <field.Input type="password" label={t('app.auth.resetPassword.confirmPassword')} autoComplete="new-password" required />}</form.AppField>
                    <FormSubmit className="w-full" disabled={mutation.isPending || !challengeId || !token}>{mutation.isPending ? t('app.auth.resetPassword.pending') : t('app.auth.resetPassword.submit')}</FormSubmit>
                  </FormLayout>
                </form.AppForm>
              )}
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout.Root>
  );
}
