import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { ADMIN_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
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
  const { callback } = Route.useSearch();
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
        <Card className="
          grid size-full grid-rows-[auto_minmax(0,1fr)] shadow-xl
        "
        >
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">로그인</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden p-6">
            <form.AppForm>
              <FormLayout
                id="operator-login-form"
                onSubmit={() => void form.handleSubmit()}
                className="
                  h-full grid-rows-[minmax(0,1fr)_auto] overflow-hidden gap-6
                "
              >
                <div className={policy.credentialAvailable
                  ? `scroll-y grid content-start gap-4`
                  : `grid content-start gap-4`}
                >
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
                          shrink-0 text-xs text-muted-foreground
                          hover:text-foreground hover:underline
                        "
                      >
                        아이디·비밀번호 찾기
                      </Link>
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <div className="grid gap-6">
                    {policy.credentialAvailable && (
                      <FormSubmit variant="default" className="w-full" disabled={loginMutation.isPending}>
                        <span>{loginMutation.isPending ? '인증 확인 중...' : '로그인'}</span>
                      </FormSubmit>
                    )}
                    {policy.oauthAvailable && Boolean(oauthProvidersQuery.data?.items.length) && (
                      <div className="grid gap-3">
                        {policy.credentialAvailable && (
                          <div className="flex items-center gap-3">
                            <Separator className="h-px flex-1 bg-border" />
                            <span className="text-xs text-muted-foreground">또는</span>
                            <Separator className="h-px flex-1 bg-border" />
                          </div>
                        )}
                        {oauthProvidersQuery.data?.items.map((provider) => (
                          <a
                            key={provider.id}
                            href={`/api/v1/auth/oauth/${encodeURIComponent(provider.id)}?callback=${encodeURIComponent(destination)}`}
                            className="
                              flex h-10 items-center justify-center gap-2
                              rounded-md border px-4 py-2 text-sm font-medium
                              transition-colors
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
