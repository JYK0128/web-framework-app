import { API_BASE_PATH, ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';

import { getAuthControllerMeV1QueryKey, useAuthControllerGetPolicyV1, useAuthControllerLoginV1, useOAuthControllerProvidersV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerLoginV1Body, authControllerLoginV1BodyTwoFactorCodeMax, authControllerLoginV1BodyTwoFactorCodeMin } from '#/.generated/api/zod/auth/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';
import { OAUTH_PROVIDER_LIST_QUERY_STALE_TIME_MS } from '#/configs/app.config';

export const Route = createFileRoute('/_global/login/')({
  validateSearch: z.object({ callback: z.string().optional() }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { callback } = Route.useSearch();
  const policyQuery = useAuthControllerGetPolicyV1();
  const oauthProvidersQuery = useOAuthControllerProvidersV1({ query: { retry: false, staleTime: OAUTH_PROVIDER_LIST_QUERY_STALE_TIME_MS } });
  const codeLength = policyQuery.data?.data.twoFactorCodeLength ?? authControllerLoginV1BodyTwoFactorCodeMin;
  const destination = (() => {
    if (!callback) return '/qna';
    try {
      const url = new URL(callback, window.location.origin);
      if (url.origin !== window.location.origin) return '/qna';
      return `${url.pathname}${url.search}${url.hash}`;
    }
    catch {
      return '/qna';
    }
  })();

  const loginMutation = useAuthControllerLoginV1({
    mutation: {
      meta: { successMessage: '로그인에 성공했습니다.' },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
        await router.invalidate();
        router.history.replace(destination);
      },
    },
  });

  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
      twoFactorCode: '',
      rememberMe: false,
    },
    validators: {
      onSubmit: AuthControllerLoginV1Body.extend({
        rememberMe: z.boolean(),
        twoFactorCode: z.union([
          z.string().length(codeLength),
          z.literal(''),
        ]),
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        await loginMutation.mutateAsync({
          data: {
            email: value.email.trim(),
            password: value.password,
            twoFactorCode: value.twoFactorCode || undefined,
            rememberMe: value.rememberMe,
          },
        });
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) {
          const fields = getValidationFieldErrors(error.details);
          form.setErrorMap({
            onSubmit: { fields },
          });
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
            <CardDescription>
              서비스 계정으로 접속해 주세요.
              {policyQuery.data?.data.credentialRegistrationAvailable && (
                <Link
                  to="/register"
                  className="underline underline-offset-4"
                >
                  회원가입
                </Link>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.AppForm>
              <FormLayout
                id="service-login-form"
                onSubmit={() => void form.handleSubmit()}
                className="gap-4"
              >
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
                <div className="-mt-2 text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm underline underline-offset-4"
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
                {(policyQuery.isLoading || policyQuery.isError || policyQuery.data?.data.twoFactorAvailable) && (
                  <form.AppField name="twoFactorCode">
                    {(field) => (
                      <field.Input
                        type="text"
                        label="2단계 인증 코드"
                        placeholder="인증 앱 코드 (설정한 경우)"
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        maxLength={Math.min(codeLength, authControllerLoginV1BodyTwoFactorCodeMax)}
                      />
                    )}
                  </form.AppField>
                )}
                <form.AppField name="rememberMe">
                  {(field) => (
                    <field.Checkbox
                      label="로그인 상태 유지"
                    />
                  )}
                </form.AppField>
                <FormSubmit
                  className="w-full mt-2"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? '인증 확인 중...' : '로그인'}
                </FormSubmit>
                {oauthProvidersQuery.data?.data.providers.length
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
                        {oauthProvidersQuery.data.data.providers.map((provider) => (
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
              </FormLayout>
            </form.AppForm>
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
