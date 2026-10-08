import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { ADMIN_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';

import { getAuthControllerMeV1QueryKey, useAuthControllerLoginV1, useOAuthControllerProvidersV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerLoginV1Body } from '#/.generated/api/zod/auth/auth';
import { Card, CardContent, Separator } from '#/.generated/shadcn/components/ui';
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
  const destination = resolveDestination(callback);
  const policy = ADMIN_AUTH_POLICY_CONFIG;
  const oauthProvidersQuery = useOAuthControllerProvidersV1({ query: { enabled: policy.oauthAvailable } });
  const loginMutation = useAuthControllerLoginV1();

  const form = useAppForm({
    defaultValues: { email: '', password: '', rememberMe: false },
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
        <Card className="flex size-full flex-col shadow-xl">
          <CardContent className="flex-1 p-6">
            <div className="grid h-full grid-rows-[auto_1fr] gap-6">
              <div className="grid justify-items-center gap-2 text-center">
                <div className="
                  flex size-12 items-center justify-center rounded-2xl
                  bg-primary text-primary-foreground shadow-md
                "
                >
                  <ShieldCheck className="size-6 shrink-0" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">로그인</h1>
              </div>
              <form.AppForm>
                <FormLayout
                  id="operator-login-form"
                  onSubmit={() => void form.handleSubmit()}
                  className="h-full grid-rows-[1fr_auto] gap-6"
                >
                  <div className="scroll-y grid gap-2">
                    {error && (
                      <p
                        role="alert"
                        className="text-sm text-destructive"
                      >
                        {getLoginErrorMessage(error)}
                      </p>
                    )}
                    {policy.credentialAvailable && (
                      <form.AppField name="email">
                        {(field) => (
                          <field.Input
                            type="email"
                            label="이메일"
                            placeholder="operator@test.com"
                            autoComplete="email"
                            leftSide={(
                              <Mail className="size-4 text-muted-foreground" />
                            )}
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
                            leftSide={(
                              <Lock className="size-4 text-muted-foreground" />
                            )}
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
                            shrink-0 text-xs text-muted-foreground
                            hover:text-foreground hover:underline
                          "
                        >
                          아이디·비밀번호 찾기
                        </Link>
                      </div>
                    )}
                    {policy.oauthAvailable && Boolean(oauthProvidersQuery.data?.items.length) && (
                      <div className="grid gap-2">
                        {oauthProvidersQuery.data?.items.map((provider) => (
                          <a
                            key={provider.id}
                            href={`/api/v1/auth/oauth/${encodeURIComponent(provider.id)}?callback=${encodeURIComponent(destination)}`}
                            className="
                              flex items-center justify-center gap-2 rounded-md
                              border px-4 py-2 text-sm
                            "
                            style={{ backgroundColor: provider.brandColor, color: provider.brandTextColor }}
                          >
                            {provider.iconUrl && (
                              <img
                                src={provider.iconUrl}
                                alt=""
                                className="size-5"
                              />
                            )}
                            {provider.name}
                            로 로그인
                          </a>
                        ))}
                      </div>
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
                  <div className="grid gap-2">
                    <Separator
                      orientation="horizontal"
                      className="h-px w-full bg-border"
                    />
                    <div className="grid gap-6">
                      {policy.credentialAvailable && (
                        <FormSubmit variant="default" className="w-full" disabled={loginMutation.isPending}>
                          <span>{loginMutation.isPending ? '인증 확인 중...' : '로그인'}</span>
                          <ArrowRight className="size-4" />
                        </FormSubmit>
                      )}
                      {policy.registrationAvailable && policy.credentialAvailable && (
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
                      {!policy.credentialAvailable && (!policy.oauthAvailable || !oauthProvidersQuery.data?.items.length) && (
                        <p
                          role="status"
                          className="text-center text-sm text-muted-foreground"
                        >
                          사용 가능한 로그인 방법이 없습니다.
                        </p>
                      )}
                    </div>
                  </div>
                </FormLayout>
              </form.AppForm>
            </div>
          </CardContent>
        </Card>
      </ScreenLayout.Content>
      <ScreenLayout.Addon>
        <Link
          to="/"
          className="
            text-xs text-muted-foreground transition-colors
            hover:text-foreground
          "
        >
          ← 홈으로 돌아가기
        </Link>
      </ScreenLayout.Addon>
    </ScreenLayout>
  );
}

function getLoginErrorMessage(error: string): string {
  switch (error) {
    case 'TWO_FACTOR_REQUIRED_FOR_OAUTH': return '이 계정은 2단계 인증을 사용합니다. 이메일과 비밀번호로 로그인해 인증 코드를 입력해 주세요.';
    case 'EMAIL_VERIFICATION_REQUIRED': return '이메일 인증을 완료한 뒤 로그인해 주세요.';
    case 'REGISTRATION_DISABLED': return '현재 새 계정 가입을 사용할 수 없습니다.';
    case 'OAUTH_VERIFIED_EMAIL_REQUIRED': return '공급자가 검증된 이메일을 제공하지 않습니다. 관리자에게 문의해 주세요.';
    case 'OAUTH_CANCELLED': return '공급자 로그인을 취소했습니다.';
    case 'OAUTH_UNAVAILABLE': return '현재 외부 계정 로그인을 사용할 수 없습니다.';
    default: return '로그인에 실패했습니다. 다시 시도해 주세요.';
  }
}

function resolveDestination(callback?: string): string {
  if (!callback) return '/profile';
  try {
    const origin = 'https://admin.invalid';
    const url = new URL(callback, origin);
    if (url.origin !== origin) return '/profile';
    return `${url.pathname}${url.search}${url.hash}`;
  }
  catch {
    return '/profile';
  }
}
