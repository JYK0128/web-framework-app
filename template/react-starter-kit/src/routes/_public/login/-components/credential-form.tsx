import { ApplicationError, z } from '@pkg/shared/common';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useEffect } from 'react';

import { useAuthControllerGetEnabledProviders, useAuthControllerLogin, useAuthControllerRegister } from '#/.generated/api/endpoints/auth/auth';
import { useSystemConfigControllerGetSystemConfig } from '#/.generated/api/endpoints/system-config/system-config';
import type { LoginCredentialResponseDto, LoginRequest, RegisterRequest } from '#/.generated/api/model';
import { AuthControllerLoginBody, AuthControllerRegisterBody } from '#/.generated/api/zod/auth/auth';
import { Button, buttonVariants, Checkbox, Label, Tabs, TabsContent, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { OAuthProviderIcon } from '#/components/app';
import { FormLayout, useAppForm } from '#/components/form';
import { AUTH_OAUTH_PATH } from '#/configs/app.config';
import { useI18n } from '#/hooks';

type CredentialFormProps = {
  activeTab: 'login' | 'register'
  onTabChange: (tab: 'login' | 'register') => void
};

export function CredentialForm({
  activeTab,
  onTabChange,
}: CredentialFormProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const configQuery = useSystemConfigControllerGetSystemConfig();
  const allowRegistration = configQuery.data?.allowRegistration;
  const allowCredentialRegistration = configQuery.data?.allowCredentialRegistration;

  const providersQuery = useAuthControllerGetEnabledProviders();
  const enabledProviders = providersQuery.data?.items ?? [];

  useEffect(() => {
    if ((allowRegistration === false || allowCredentialRegistration === false) && activeTab === 'register') {
      onTabChange('login');
    }
  }, [allowRegistration, allowCredentialRegistration, activeTab, onTabChange]);

  const handleLoginSuccess = async (response: LoginCredentialResponseDto) => {
    if (response.challengeId) {
      await navigate({
        to: '/login/2fa',
        search: { challengeId: response.challengeId, expiresIn: response.expiresIn },
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
        const payload: LoginRequest = {
          email: value.email,
          password: value.password,
          rememberMe: value.rememberMe,
        };
        await loginMutation.mutateAsync({
          data: payload,
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
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: registerSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const payload: RegisterRequest = {
          email: value.email.trim().toLowerCase(),
          password: value.password,
          confirmPassword: value.confirmPassword,
        };
        await registerMutation.mutateAsync({
          data: payload,
        });
        const loginPayload: LoginRequest = { email: value.email, password: value.password };
        await loginMutation.mutateAsync({
          data: loginPayload,
        });
      }
      catch (error) {
        if (error instanceof ApplicationError) {
          if (error.details) {
            registerForm.setErrorMap({
              onSubmit: error.details as never,
            });
          }
        }
      }
    },
  });

  let registerDisabledTitle: string | undefined;
  if (!allowRegistration) {
    registerDisabledTitle = t('login.registrationDisabled');
  }
  else if (!allowCredentialRegistration) {
    registerDisabledTitle = t('login.credentialRegistrationDisabled');
  }

  return (
    <div className="h-[500px] flex flex-col justify-between">
      <Tabs
        value={activeTab}
        onValueChange={(val) => onTabChange(val as 'login' | 'register')}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">{t('login.login')}</TabsTrigger>
          <TabsTrigger
            value="register"
            disabled={!allowRegistration || !allowCredentialRegistration}
            title={registerDisabledTitle}
          >
            {t('login.register')}
          </TabsTrigger>
        </TabsList>

        {/* 1. Login Tab Content */}
        <TabsContent
          value="login"
          className="flex-1 flex flex-col py-2 gap-3"
        >
          <loginForm.AppForm>
            <div className="flex flex-1 flex-col justify-between gap-3">
              <FormLayout
                id="credential-login-form"
                onSubmit={() => void loginForm.handleSubmit()}
                className="h-[280px] shrink-0"
              >
                <div className="
                  flex h-full flex-col justify-evenly scroll-y
                  *:shrink-0
                "
                >
                  <loginForm.AppField name="email">
                    {(field) => (
                      <field.Input
                        type="email"
                        label={t('login.emailLabel')}
                        placeholder={t('login.emailPlaceholder')}
                        autoComplete="username"
                        leftSide={(
                          <Mail className="
                            size-4 text-muted-foreground shrink-0
                          "
                          />
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
                          <Lock className="
                            size-4 text-muted-foreground shrink-0
                          "
                          />
                        )}
                        required
                      />
                    )}
                  </loginForm.AppField>
                </div>
              </FormLayout>

              <loginForm.AppField name="rememberMe">
                {(field) => (
                  <div className="
                    h-6 shrink-0 flex items-center justify-between
                  "
                  >
                    <div className="flex items-center gap-2">
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

                    <Link
                      to="/find-account"
                      className="
                        text-xs text-muted-foreground
                        hover:text-foreground hover:underline
                        transition-colors
                      "
                    >
                      {t('login.findAccount') || '아이디 · 비밀번호 찾기'}
                    </Link>
                  </div>
                )}
              </loginForm.AppField>

              <loginForm.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    type="submit"
                    form="credential-login-form"
                    disabled={isSubmitting}
                    className="w-full shrink-0"
                  >
                    <span>{isSubmitting ? t('login.processing') : t('login.loginSubmit')}</span>
                    <ArrowRight className="size-4 shrink-0" />
                  </Button>
                )}
              </loginForm.Subscribe>
            </div>
          </loginForm.AppForm>
        </TabsContent>

        {/* 2. Register Tab Content */}
        <TabsContent
          value="register"
          className="flex-1 flex flex-col py-2 gap-3"
        >
          <registerForm.AppForm>
            <div className="flex flex-1 flex-col justify-between gap-3">
              <FormLayout
                id="credential-register-form"
                onSubmit={() => void registerForm.handleSubmit()}
                className="h-[280px] shrink-0"
              >
                <div className="
                  flex h-full flex-col justify-evenly scroll-y
                  *:shrink-0
                "
                >
                  <registerForm.AppField name="email">
                    {(field) => (
                      <field.Input
                        type="email"
                        label={t('login.emailLabel')}
                        placeholder={t('login.emailPlaceholder')}
                        autoComplete="username"
                        leftSide={(
                          <Mail className="
                            size-4 text-muted-foreground shrink-0
                          "
                          />
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
                          <Lock className="
                            size-4 text-muted-foreground shrink-0
                          "
                          />
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
                          <Lock className="
                            size-4 text-muted-foreground shrink-0
                          "
                          />
                        )}
                        required
                      />
                    )}
                  </registerForm.AppField>
                </div>
              </FormLayout>

              <div className="h-6 shrink-0" aria-hidden="true" />

              <registerForm.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    type="submit"
                    form="credential-register-form"
                    disabled={isSubmitting}
                    className="w-full shrink-0"
                  >
                    <span>{isSubmitting ? t('login.processing') : t('login.registerSubmit')}</span>
                    <ArrowRight className="size-4 shrink-0" />
                  </Button>
                )}
              </registerForm.Subscribe>
            </div>
          </registerForm.AppForm>
        </TabsContent>
      </Tabs>

      {/* 소셜 로그인 또는 서비스 소개 */}
      <div className="h-[76px] shrink-0 flex flex-col justify-end">
        {enabledProviders.length === 0 && (
          <div className="
            flex flex-col items-center gap-2 border-t border-border pt-3
            text-center
          "
          >
            <p className="text-xs text-muted-foreground">{t('login.serviceIntro')}</p>
            <Link
              to="/"
              className="
                inline-flex items-center gap-1 text-xs font-medium
                text-foreground
                hover:underline
              "
            >
              {t('login.learnMore')}
              <ArrowRight className="size-3" aria-hidden="true" />
            </Link>
          </div>
        )}
        {enabledProviders.length > 0 && (
          <div className="space-y-2">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="
                relative bg-card px-2 text-[11px] uppercase font-semibold
                text-muted-foreground
              "
              >
                {t('login.or')}
              </span>
            </div>

            <div className={cn(
              'grid gap-2',
              enabledProviders.length === 1 && 'grid-cols-1',
              enabledProviders.length === 2 && 'grid-cols-2',
              enabledProviders.length >= 3 && 'grid-cols-3',
            )}
            >
              {enabledProviders.slice(0, 3).map((provider) => (
                <a
                  key={provider.id}
                  href={`${AUTH_OAUTH_PATH}/${provider.id}`}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    `
                      h-10 w-full flex items-center justify-center gap-2 text-xs
                      font-medium transition-colors overflow-hidden
                      hover:bg-accent
                    `,
                  )}
                >
                  <OAuthProviderIcon
                    iconUrl={provider.iconUrl}
                    className="size-4 shrink-0"
                  />
                  <span className="truncate">
                    {t('oauth.continueWith', { provider: provider.name })}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
