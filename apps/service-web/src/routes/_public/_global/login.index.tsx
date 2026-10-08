import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';

import { getAuthControllerMeV1QueryKey, useAuthControllerLoginV1, useOAuthControllerProvidersV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerLoginV1Body } from '#/.generated/api/zod/auth/auth';
import { Card, CardContent, CardHeader, CardTitle, Separator } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';

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
  const policy = SERVICE_AUTH_POLICY_CONFIG;
  const oauthProvidersQuery = useOAuthControllerProvidersV1({ query: { enabled: policy.oauthAvailable } });
  const oauthProviders = oauthProvidersQuery.data;
  const hasOAuthProviders = policy.oauthAvailable && Boolean(oauthProviders?.items.length);
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
            search: { callback: destination },
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
      <ScreenLayout.Content size="md">
        <Card className="
          grid size-full grid-rows-[auto_minmax(0,1fr)] shadow-xl border
          border-border/40
        "
        >
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
          <CardContent className="scroll-y">
            <form.AppForm>
              <FormLayout
                id="service-login-form"
                onSubmit={() => void form.handleSubmit()}
                className="gap-6"
              >
                <div className="grid gap-4">
                  {policy.credentialAvailable && (
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
                  )}
                  {policy.credentialAvailable && (
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
                  )}
                  {policy.credentialAvailable && (
                    <div className="flex items-center justify-between gap-2">
                      <form.AppField name="rememberMe">
                        {(field) => <field.Checkbox label="로그인 상태 유지" showError={false} />}
                      </form.AppField>
                      <Link
                        to="/find-account"
                        className="
                          shrink-0 text-sm underline underline-offset-4
                        "
                      >
                        비밀번호를 잊으셨나요?
                      </Link>
                    </div>
                  )}
                  {policy.credentialAvailable && (
                    <FormSubmit
                      variant="default"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? '인증 확인 중...' : '로그인'}
                    </FormSubmit>
                  )}
                  {policy.credentialAvailable && policy.emailVerificationRequired && (
                    <Link
                      to="/verify-email"
                      search={{}}
                      className="
                        text-center text-xs text-muted-foreground
                        hover:text-foreground hover:underline
                      "
                    >
                      이메일 인증 메일 다시 받기
                    </Link>
                  )}
                </div>
                {hasOAuthProviders && (
                  <div className="grid gap-3">
                    {policy.credentialAvailable && (
                      <div className="flex items-center gap-3">
                        <Separator
                          orientation="horizontal"
                          className="h-px flex-1 bg-border"
                        />
                        <span className="text-xs text-muted-foreground">또는</span>
                        <Separator
                          orientation="horizontal"
                          className="h-px flex-1 bg-border"
                        />
                      </div>
                    )}
                    <div className="grid gap-2">
                      {oauthProviders?.items.map((provider) => (
                        <a
                          key={provider.id}
                          href={`/api/v1/auth/oauth/${encodeURIComponent(provider.id)}?callback=${encodeURIComponent(destination)}`}
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
                )}
                {policy.registrationAvailable && policy.credentialAvailable && (
                  <div className="border-t pt-4 text-center text-sm">
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
                {!policy.credentialAvailable && !hasOAuthProviders && (
                  <p
                    role="status"
                    className="text-center text-sm text-muted-foreground"
                  >
                    사용 가능한 로그인 방법이 없습니다.
                  </p>
                )}
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
    case 'OAUTH_UNAVAILABLE': return '현재 외부 계정 로그인을 사용할 수 없습니다.';
    default: return '외부 계정 로그인을 완료하지 못했습니다. 다시 시도해 주세요.';
  }
}
