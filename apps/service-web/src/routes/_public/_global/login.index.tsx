import { API_BASE_PATH } from '@pkg/shared/config';
import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';

import { getAuthControllerMeV1QueryKey, useAuthControllerGetPolicyV1, useAuthControllerLoginV1, useOAuthControllerProvidersV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerLoginV1Body } from '#/.generated/api/zod/auth/auth';
import { Card, CardContent, CardHeader, CardTitle, Separator } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';
import { OAUTH_PROVIDER_LIST_QUERY_STALE_TIME_MS } from '#/configs/app.config';

export const Route = createFileRoute('/_public/_global/login/')({
  validateSearch: z.object({ callback: z.string().optional(), error: z.string().optional() }),
  beforeLoad: ({ context, search }) => {
    if (context.user) throw redirect({ href: resolveDestination(search.callback), replace: true });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { callback, error } = Route.useSearch();
  const policyQuery = useAuthControllerGetPolicyV1();
  const oauthProvidersQuery = useOAuthControllerProvidersV1({ query: { retry: false, staleTime: OAUTH_PROVIDER_LIST_QUERY_STALE_TIME_MS } });
  const destination = resolveDestination(callback);

  const loginMutation = useAuthControllerLoginV1();

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validators: { onSubmit: AuthControllerLoginV1Body.extend({ rememberMe: z.boolean() }) },
    onSubmit: async ({ value }) => {
      try {
        const result = await loginMutation.mutateAsync({
          data: {
            email: value.email.trim(),
            password: value.password,
            rememberMe: value.rememberMe,
          },
        });
        if (result.requiresTwoFactor) {
          await navigate({
            to: '/login/2fa',
            search: { callback },
            state: { twoFactorChallengeToken: result.twoFactorChallengeToken },
          });
          return;
        }
        queryClient.removeQueries({ queryKey: getAuthControllerMeV1QueryKey() });
        await navigate({ href: destination, replace: true });
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) {
          const fields = getValidationFieldErrors(error.details);
          form.setErrorMap({
            onSubmit: { fields },
          });
        }
        else {
          throw error;
        }
      }
    },
  });

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full max-w-md shadow-xl border border-border/40">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">로그인</CardTitle>
            {error && (
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {getOAuthErrorMessage(error)}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form.AppForm>
              <FormLayout
                id="service-login-form"
                onSubmit={() => void form.handleSubmit()}
                className="gap-6"
              >
                <div className="grid gap-4">
                  <form.AppField name="email">
                    {(field) => (
                      <field.Input
                        type="email"
                        label="이메일"
                        placeholder="user@example.com"
                        autoComplete="email"
                        required
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="password">
                    {(field) => (
                      <field.Input
                        type="password"
                        label="비밀번호"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                      />
                    )}
                  </form.AppField>
                  <div className="flex items-center justify-between gap-2">
                    <form.AppField name="rememberMe">
                      {(field) => <field.Checkbox label="로그인 상태 유지" showError={false} />}
                    </form.AppField>
                    <Link
                      to="/find-account"
                      className="shrink-0 text-sm underline underline-offset-4"
                    >
                      비밀번호를 잊으셨나요?
                    </Link>
                  </div>
                  {oauthProvidersQuery.data?.items.length
                    ? (
                      <div className="grid gap-3 pt-2">
                        <div className="
                          relative text-center text-xs text-muted-foreground
                        "
                        >
                          <span className="bg-card px-2">
                            또는 외부 계정으로 로그인
                          </span>
                        </div>
                        <div className="grid gap-2">
                          {oauthProvidersQuery.data.items.map((provider) => (
                            <a
                              key={provider.id}
                              href={`${API_BASE_PATH}/auth/oauth/${encodeURIComponent(provider.id)}?callback=${encodeURIComponent(destination)}`}
                              className="
                                inline-flex min-h-10 items-center justify-center
                                gap-2 rounded-md border px-4 py-2 text-sm
                                font-medium transition-colors
                                hover:bg-accent hover:text-accent-foreground
                              "
                              style={{ backgroundColor: provider.brandColor, color: provider.brandTextColor }}
                            >
                              {provider.iconUrl && (
                                <img
                                  src={provider.iconUrl}
                                  alt=""
                                  className="size-5 object-contain"
                                />
                              )}
                              {provider.name}
                              로 로그인
                            </a>
                          ))}
                        </div>
                      </div>
                    )
                    : null}
                </div>
                <div className="grid gap-6">
                  <Separator
                    orientation="horizontal"
                    className="h-px w-full bg-border"
                  />
                  <FormSubmit
                    variant="default"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? '인증 확인 중...' : '로그인'}
                  </FormSubmit>
                  {policyQuery.data?.credentialRegistrationAvailable && (
                    <div className="text-center text-sm">
                      <span className="text-muted-foreground">계정이 없으신가요?</span>
                      <Link
                        to="/register"
                        className="
                          ml-2 font-medium text-foreground underline
                          underline-offset-4
                        "
                      >
                        회원가입
                      </Link>
                    </div>
                  )}
                </div>
              </FormLayout>
            </form.AppForm>
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}

function resolveDestination(callback?: string): string {
  if (!callback) return '/';
  try {
    const origin = 'https://service.invalid';
    const url = new URL(callback, origin);
    if (url.origin !== origin) return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  }
  catch {
    return '/';
  }
}

function getOAuthErrorMessage(code: string): string {
  switch (code) {
    case 'TWO_FACTOR_REQUIRED_FOR_OAUTH': return '이 계정은 2단계 인증을 사용합니다. 이메일과 비밀번호로 로그인해 인증 코드를 입력해 주세요.';
    case 'EMAIL_VERIFICATION_REQUIRED': return '이메일 인증을 완료한 뒤 로그인해 주세요.';
    case 'REGISTRATION_DISABLED': return '현재 새 계정 가입을 사용할 수 없습니다.';
    case 'OAUTH_VERIFIED_EMAIL_REQUIRED': return '공급자가 검증된 이메일을 제공하지 않습니다. 관리자에게 문의해 주세요.';
    case 'OAUTH_CANCELLED': return '공급자 로그인을 취소했습니다.';
    default: return '외부 계정 로그인을 완료하지 못했습니다. 다시 시도해 주세요.';
  }
}
