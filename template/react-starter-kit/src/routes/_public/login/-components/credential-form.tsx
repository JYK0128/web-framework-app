import { ApplicationError, z } from '@pkg/shared/common';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';

import { useAuthControllerLogin, useAuthControllerRegister } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerLoginBody, AuthControllerRegisterBody } from '#/.generated/api/zod/auth/auth';
import { Button, buttonVariants, Checkbox, Label, Tabs, TabsContent, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';

type CredentialFormProps = {
  activeTab: 'login' | 'register'
  onTabChange: (tab: 'login' | 'register') => void
};

export function CredentialForm({ activeTab, onTabChange }: CredentialFormProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleLoginSuccess = async (response: { challengeId?: string, expiresIn?: number }) => {
    if (response?.challengeId) {
      await navigate({
        to: '/login/2fa',
        search: { challengeId: response.challengeId, expiresIn: response.expiresIn ?? 180 },
        replace: true,
      });
      return;
    }
    await navigate({ to: '/dashboard', replace: true });
  };

  const loginMutation = useAuthControllerLogin({
    mutation: {
      onSuccess: handleLoginSuccess,
    },
  });

  const registerMutation = useAuthControllerRegister();

  const loginForm = useAppForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
    validators: {
      onSubmit: AuthControllerLoginBody.extend({ rememberMe: z.boolean() }),
    },
    onSubmit: async ({ value }) => {
      try {
        await loginMutation.mutateAsync({
          data: {
            email: value.email,
            password: value.password,
            rememberMe: value.rememberMe,
          },
        });
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) {
          loginForm.setErrorMap({
            onSubmit: error.details as never,
          });
        }
      }
    },
  });

  const registerSchema = AuthControllerRegisterBody.refine((data) => data.password === data.confirmPassword, {
    message: t('login.passwordMismatch'),
    path: ['confirmPassword'],
  });

  const registerForm = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: registerSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await registerMutation.mutateAsync({
          data: {
            email: value.email,
            password: value.password,
            name: value.name,
            confirmPassword: value.confirmPassword,
          },
        });
        await loginMutation.mutateAsync({
          data: { email: value.email, password: value.password },
        });
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) {
          registerForm.setErrorMap({
            onSubmit: error.details as never,
          });
        }
      }
    },
  });

  return (
    <div className="h-[390px] flex flex-col justify-between">
      <Tabs
        value={activeTab}
        onValueChange={(val) => onTabChange(val as 'login' | 'register')}
        className="flex flex-1 flex-col"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">{t('login.login')}</TabsTrigger>
          <TabsTrigger value="register">{t('login.register')}</TabsTrigger>
        </TabsList>

        {/* 1. Login Tab Content */}
        <TabsContent value="login" className="flex-1 pt-3">
          <loginForm.AppForm>
            <FormLayout
              id="credential-login-form"
              onSubmit={() => void loginForm.handleSubmit()}
              className="grid gap-3"
            >
              <loginForm.AppField name="email">
                {(field) => (
                  <field.Input
                    type="email"
                    label={t('login.emailLabel')}
                    placeholder={t('login.emailPlaceholder')}
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
                    label={t('login.passwordLabel')}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    leftSide={(
                      <Lock className="size-4 text-muted-foreground shrink-0" />
                    )}
                    required
                  />
                )}
              </loginForm.AppField>

              <loginForm.AppField name="rememberMe">
                {(field) => (
                  <div className="flex items-center justify-end gap-2">
                    <Checkbox
                      id="rememberMe"
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="
                        text-xs font-normal cursor-pointer select-none
                        text-muted-foreground
                        hover:text-foreground
                      "
                    >
                      {t('login.rememberMe')}
                    </Label>
                  </div>
                )}
              </loginForm.AppField>
            </FormLayout>
          </loginForm.AppForm>
        </TabsContent>

        {/* 2. Register Tab Content */}
        <TabsContent value="register" className="scroll-y flex-1 pt-3">
          <registerForm.AppForm>
            <FormLayout
              id="credential-register-form"
              onSubmit={() => void registerForm.handleSubmit()}
              className="grid gap-3"
            >
              <registerForm.AppField name="name">
                {(field) => (
                  <field.Input
                    type="text"
                    label={t('login.nameLabel')}
                    placeholder={t('login.namePlaceholder')}
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
                    label={t('login.emailLabel')}
                    placeholder={t('login.emailPlaceholder')}
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
                    label={t('login.passwordLabel')}
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
                    label={t('login.confirmPasswordLabel')}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    leftSide={(
                      <Lock className="size-4 text-muted-foreground shrink-0" />
                    )}
                    required
                  />
                )}
              </registerForm.AppField>
            </FormLayout>
          </registerForm.AppForm>
        </TabsContent>
      </Tabs>

      {/* Shared Action Footer (100% position & height identical between tabs) */}
      <div className="grid gap-2.5 pt-2">
        {activeTab === 'login'
          ? (
            <loginForm.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  form="credential-login-form"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <span>{isSubmitting ? t('login.processing') : t('login.loginSubmit')}</span>
                  <ArrowRight className="size-4 shrink-0" />
                </Button>
              )}
            </loginForm.Subscribe>
          )
          : (
            <registerForm.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  form="credential-register-form"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <span>{isSubmitting ? t('login.processing') : t('login.registerSubmit')}</span>
                  <ArrowRight className="size-4 shrink-0" />
                </Button>
              )}
            </registerForm.Subscribe>
          )}

        <div className="flex items-center gap-3 my-0.5">
          <div className="flex-1 h-px bg-border" />
          <span className="
            text-xs uppercase text-muted-foreground font-semibold shrink-0
          "
          >
            {t('login.or')}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <a
          href="/api/v1/auth/google"
          className={buttonVariants({ variant: 'outline', className: 'w-full' })}
        >
          {t('login.continueWithGoogle')}
        </a>
      </div>
    </div>
  );
}
