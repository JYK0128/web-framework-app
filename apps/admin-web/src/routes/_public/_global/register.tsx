import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { ADMIN_AUTH_POLICY_CONFIG, assertPasswordPolicy } from '@pkg/shared/policy';
import { useI18n } from '@pkg/web-core/context/i18n';
import { FormLayout, FormSubmit, useAppForm } from '@pkg/web-core/form';
import { ScreenLayout } from '@pkg/web-core/template';
import { createFileRoute, Link } from '@tanstack/react-router';

import { useAuthControllerRegisterV1, useAuthControllerRequestEmailVerificationV1 } from '~/.generated/api/endpoints/auth/auth';
import { AuthControllerRegisterV1Body } from '~/.generated/api/zod/auth/auth';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/.generated/shadcn/components/ui';

export const Route = createFileRoute('/_public/_global/register')({ component: RegisterPage });

function RegisterPage() {
  const { t, i18n } = useI18n();
  const policy = ADMIN_AUTH_POLICY_CONFIG;
  const registerMutation = useAuthControllerRegisterV1();
  const requestVerificationMutation = useAuthControllerRequestEmailVerificationV1();

  const form = useAppForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    validators: {
      onSubmit: AuthControllerRegisterV1Body.extend({ password: z.string(), confirmPassword: z.string() })
        .superRefine((value, context) => {
          try {
            assertPasswordPolicy(value.password, policy);
          }
          catch (error) {
            if (!(error instanceof ApplicationError)) throw error;
            const message = error.translate(i18n);
            context.addIssue({ code: 'custom', path: ['password'], message });
          }
          if (value.password !== value.confirmPassword) {
            context.addIssue({ code: 'custom', path: ['confirmPassword'], message: t('app.auth.register.passwordMismatch') });
          }
        }),
    },
    onSubmit: async ({ value }) => {
      try {
        const email = value.email.trim().toLowerCase();
        await registerMutation.mutateAsync({ data: { name: value.name, email, password: value.password } });
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) {
          form.setErrorMap({ onSubmit: { fields: getValidationFieldErrors(error.details) } });
        }
      }
    },
  });

  const registered = registerMutation.data && {
    email: registerMutation.variables?.data.email ?? '',
    verificationRequired: registerMutation.data.emailVerificationRequired,
    emailQueued: requestVerificationMutation.isSuccess || registerMutation.data.verificationEmailQueued,
  };

  const resendVerification = () => {
    if (registered) requestVerificationMutation.mutate({ data: { email: registered.email } });
  };

  const renderRegistrationContent = () => {
    if (registered) {
      let statusMessage = t('app.auth.register.continue');
      if (registered.verificationRequired) {
        statusMessage = registered.emailQueued
          ? t('app.auth.register.verificationQueued', { email: registered.email })
          : t('app.auth.register.verificationRequired');
      }

      return (
        <div className="grid gap-4">
          <p role="status" className="text-sm">{statusMessage}</p>
          {registered.verificationRequired && (
            <Button
              variant="outline"
              onClick={resendVerification}
              disabled={requestVerificationMutation.isPending}
            >
              {requestVerificationMutation.isPending ? t('app.auth.register.resendPending') : t('app.auth.register.resend')}
            </Button>
          )}
          <Link to="/login" className="text-sm underline underline-offset-4">{t('app.auth.register.login')}</Link>
        </div>
      );
    }

    if (!policy.registrationAvailable || !policy.credentialAvailable) {
      return (
        <div className="grid gap-4">
          <p role="status" className="text-sm">{t('app.auth.register.unavailable')}</p>
          <Link to="/login" className="text-sm underline underline-offset-4">{t('app.auth.register.login')}</Link>
        </div>
      );
    }

    return (
      <form.AppForm>
        <FormLayout
          id="admin-register-form"
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
          <form.AppField name="name">
            {(field) => <field.Input label={t('app.auth.register.name')} autoComplete="name" required />}
          </form.AppField>
          <form.AppField name="email">
            {(field) => <field.Input type="email" label={t('app.auth.register.email')} autoComplete="email" required />}
          </form.AppField>
          <form.AppField name="password">
            {(field) => (
              <field.Input
                type="password"
                label={t('app.auth.register.password')}
                minLength={policy.passwordMinLength}
                maxLength={policy.passwordMaxLength}
                autoComplete="new-password"
                required
              />
            )}
          </form.AppField>
          <form.AppField name="confirmPassword">
            {(field) => <field.Input type="password" label={t('app.auth.register.confirmPassword')} autoComplete="new-password" required />}
          </form.AppField>
          <FormSubmit className="w-full" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? t('app.auth.register.pending') : t('app.auth.register.submit')}
          </FormSubmit>
        </FormLayout>
      </form.AppForm>
    );
  };

  return (
    <ScreenLayout.Root>
      <ScreenLayout.Content size="md">
        <Card className="
          grid size-full grid-rows-[auto_minmax(0,1fr)] shadow-xl
        "
        >
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">{t('app.auth.register.title')}</CardTitle>
            <CardDescription>{t('app.auth.register.description')}</CardDescription>
          </CardHeader>
          <CardContent className="scroll-y">
            {renderRegistrationContent()}
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout.Root>
  );
}
