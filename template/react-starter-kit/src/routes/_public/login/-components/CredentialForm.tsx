import { useI18n } from '@pkg/shared/web';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

import { useAuthControllerIssueCredentialToken, useAuthControllerRegisterWithoutSession } from '#/.generated/api/endpoints/auth/auth';
import { Button, buttonVariants, Separator, Tabs, TabsContent, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';

type CredentialFormProps = {
  activeTab: 'login' | 'register'
  onTabChange: (tab: 'login' | 'register') => void
};

export function CredentialForm({ activeTab, onTabChange }: CredentialFormProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleLoginSuccess = async (response: { challengeId?: string }) => {
    if (response?.challengeId) {
      await navigate({
        to: '/login/2fa',
        search: { challengeId: response.challengeId },
        replace: true,
      });
      return;
    }
    await navigate({ to: '/dashboard', replace: true });
  };

  const loginMutation = useAuthControllerIssueCredentialToken({
    mutation: {
      onSuccess: handleLoginSuccess,
    },
  });

  const registerMutation = useAuthControllerRegisterWithoutSession();

  const loginForm = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await loginMutation.mutateAsync({
        data: { email: value.email, password: value.password },
      });
    },
  });

  const registerForm = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      if (value.password !== value.confirmPassword) {
        toast.error(t('auth.passwordMismatch'));
        return;
      }
      await registerMutation.mutateAsync({
        data: {
          email: value.email,
          password: value.password,
          name: value.name,
        },
      });
      await loginMutation.mutateAsync({
        data: { email: value.email, password: value.password },
      });
    },
  });

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => onTabChange(val as 'login' | 'register')}
      className="grid gap-4"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
        <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
      </TabsList>

      {/* 1. Login Tab Content */}
      <TabsContent value="login">
        <loginForm.AppForm>
          <FormLayout
            onSubmit={() => void loginForm.handleSubmit()}
            className="grid gap-4"
          >
            <loginForm.AppField name="email">
              {(field) => (
                <field.Input
                  type="email"
                  label={t('auth.emailLabel')}
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="username"
                  leftSide={(
                    <Mail className="size-4 text-muted-foreground shrink-0" />
                  )}
                  required
                />
              )}
            </loginForm.AppField>

            <loginForm.AppField name="password">
              {(field) => (
                <field.Input
                  type="password"
                  label={t('auth.passwordLabel')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  leftSide={(
                    <Lock className="size-4 text-muted-foreground shrink-0" />
                  )}
                  required
                />
              )}
            </loginForm.AppField>

            <loginForm.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  <span>{isSubmitting ? t('common.processing') : t('auth.loginSubmit')}</span>
                  <ArrowRight className="size-4 shrink-0" />
                </Button>
              )}
            </loginForm.Subscribe>

            <div className="relative flex items-center justify-center my-2">
              <Separator className="w-full" />
              <span className="
                absolute bg-card px-2 text-2xs uppercase text-muted-foreground
                font-semibold
              "
              >
                {t('auth.or')}
              </span>
            </div>

            <a
              href="/api/v1/auth/google"
              className={buttonVariants({ variant: 'outline', className: 'w-full' })}
            >
              {t('auth.continueWithGoogle')}
            </a>
          </FormLayout>
        </loginForm.AppForm>
      </TabsContent>

      {/* 2. Register Tab Content */}
      <TabsContent value="register">
        <registerForm.AppForm>
          <FormLayout
            onSubmit={() => void registerForm.handleSubmit()}
            className="grid gap-4"
          >
            <registerForm.AppField name="name">
              {(field) => (
                <field.Input
                  type="text"
                  label={t('auth.nameLabel')}
                  placeholder={t('auth.namePlaceholder')}
                  autoComplete="name"
                  leftSide={(
                    <User className="size-4 text-muted-foreground shrink-0" />
                  )}
                  required
                />
              )}
            </registerForm.AppField>

            <registerForm.AppField name="email">
              {(field) => (
                <field.Input
                  type="email"
                  label={t('auth.emailLabel')}
                  placeholder={t('auth.emailPlaceholder')}
                  autoComplete="username"
                  leftSide={(
                    <Mail className="size-4 text-muted-foreground shrink-0" />
                  )}
                  required
                />
              )}
            </registerForm.AppField>

            <registerForm.AppField name="password">
              {(field) => (
                <field.Input
                  type="password"
                  label={t('auth.passwordLabel')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  leftSide={(
                    <Lock className="size-4 text-muted-foreground shrink-0" />
                  )}
                  required
                />
              )}
            </registerForm.AppField>

            <registerForm.AppField name="confirmPassword">
              {(field) => (
                <field.Input
                  type="password"
                  label={t('auth.confirmPasswordLabel')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  leftSide={(
                    <Lock className="size-4 text-muted-foreground shrink-0" />
                  )}
                  required
                />
              )}
            </registerForm.AppField>

            <registerForm.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  <span>{isSubmitting ? t('common.processing') : t('auth.registerSubmit')}</span>
                  <ArrowRight className="size-4 shrink-0" />
                </Button>
              )}
            </registerForm.Subscribe>

            <div className="relative flex items-center justify-center my-2">
              <Separator className="w-full" />
              <span className="
                absolute bg-card px-2 text-2xs uppercase text-muted-foreground
                font-semibold
              "
              >
                {t('auth.or')}
              </span>
            </div>

            <a
              href="/api/v1/auth/google"
              className={buttonVariants({ variant: 'outline', className: 'w-full' })}
            >
              {t('auth.continueWithGoogle')}
            </a>
          </FormLayout>
        </registerForm.AppForm>
      </TabsContent>
    </Tabs>
  );
}
