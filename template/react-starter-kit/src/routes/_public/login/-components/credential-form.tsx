import { ApplicationError, z } from '@pkg/shared/common';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { useAuthControllerGetEnabledProviders, useAuthControllerLogin, useAuthControllerRegister } from '#/.generated/api/endpoints/auth/auth';
import { useSystemConfigControllerGetSystemConfig } from '#/.generated/api/endpoints/system-config/system-config';
import type { EnabledOAuthProviderItemDto, GetSystemConfigResponseDto } from '#/.generated/api/model';
import { AuthControllerLoginBody, AuthControllerRegisterBody } from '#/.generated/api/zod/auth/auth';
import { Button, buttonVariants, Checkbox, Label, Tabs, TabsContent, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormLayout, useAppForm } from '#/components/form';
import { AUTH_OAUTH_PATH } from '#/configs/app.config';
import { QUERY_GC_TIME_30S, QUERY_GC_TIME_120S, QUERY_STALE_TIME_10S, QUERY_STALE_TIME_60S } from '#/configs/query.config';
import { useI18n } from '#/hooks';

type CredentialFormProps = {
  activeTab: 'login' | 'register'
  onTabChange: (tab: 'login' | 'register') => void
  initialProviders?: EnabledOAuthProviderItemDto[]
  initialConfig?: GetSystemConfigResponseDto | null
};

export function CredentialForm({
  activeTab,
  onTabChange,
  initialProviders,
  initialConfig,
}: CredentialFormProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const configQuery = useSystemConfigControllerGetSystemConfig({
    query: {
      initialData: initialConfig ?? undefined,
      staleTime: QUERY_STALE_TIME_10S,
      gcTime: QUERY_GC_TIME_30S,
    },
  });
  const allowRegistration = configQuery.data?.allowRegistration;
  const allowPasswordRegistration = configQuery.data?.allowPasswordRegistration;

  const providersQuery = useAuthControllerGetEnabledProviders({
    query: {
      initialData: initialProviders ? { items: initialProviders, providers: initialProviders.map((p) => p.id) } : undefined,
      staleTime: QUERY_STALE_TIME_60S,
      gcTime: QUERY_GC_TIME_120S,
    },
  });
  const enabledProviders = providersQuery.data?.items ?? [];

  useEffect(() => {
    if ((!allowRegistration || !allowPasswordRegistration) && activeTab === 'register') {
      onTabChange('login');
    }
  }, [allowRegistration, allowPasswordRegistration, activeTab, onTabChange]);

  const handleLoginSuccess = async (response: { challengeId?: string, expiresIn?: number }) => {
    if (response?.challengeId) {
      await navigate({
        to: '/login/2fa',
        search: { challengeId: response.challengeId, expiresIn: response.expiresIn ?? 300 },
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
        if (error instanceof ApplicationError) {
          if (error.details) {
            registerForm.setErrorMap({
              onSubmit: error.details as never,
            });
          }
          else if (error.message) {
            toast.error(error.message);
          }
        }
      }
    },
  });

  let registerDisabledTitle: string | undefined;
  if (!allowRegistration) {
    registerDisabledTitle = t('login.registrationDisabled');
  }
  else if (!allowPasswordRegistration) {
    registerDisabledTitle = t('login.passwordRegistrationDisabled');
  }

  return (
    <div className="h-[440px] flex flex-col justify-between">
      <Tabs
        value={activeTab}
        onValueChange={(val) => onTabChange(val as 'login' | 'register')}
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">{t('login.login')}</TabsTrigger>
          <TabsTrigger
            value="register"
            disabled={!allowRegistration || !allowPasswordRegistration}
            title={registerDisabledTitle}
          >
            {t('login.register')}
          </TabsTrigger>
        </TabsList>

        {/* 1. Login Tab Content */}
        <TabsContent
          value="login"
          className="flex-1 flex flex-col min-h-0 py-2 gap-3"
        >
          <loginForm.AppForm>
            <FormLayout
              id="credential-login-form"
              onSubmit={() => void loginForm.handleSubmit()}
              className="flex flex-col flex-1 min-h-0 justify-around gap-3"
            >
              <div className="space-y-3 scroll-y min-h-0">
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
              </div>

              <loginForm.AppField name="rememberMe">
                {(field) => (
                  <div className="flex items-center justify-between pt-0.5">
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
            </FormLayout>
          </loginForm.AppForm>
        </TabsContent>

        {/* 2. Register Tab Content */}
        <TabsContent
          value="register"
          className="flex-1 flex flex-col min-h-0 py-2 gap-3"
        >
          <registerForm.AppForm>
            <FormLayout
              id="credential-register-form"
              onSubmit={() => void registerForm.handleSubmit()}
              className="flex flex-col flex-1 min-h-0 gap-3"
            >
              <div className="space-y-3 scroll-y flex-1">
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
              </div>

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
            </FormLayout>
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
                  {provider.resource && (
                    <span
                      className="
                        inline-flex items-center justify-center max-h-5 shrink-0
                        [&_svg]:max-h-5 [&_svg]:w-auto
                        [&_img]:max-h-5 [&_img]:w-auto
                      "
                      dangerouslySetInnerHTML={{ __html: provider.resource }}
                    />
                  )}
                  <span className="truncate">{t(`oauth.${provider.id}` as never)}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
