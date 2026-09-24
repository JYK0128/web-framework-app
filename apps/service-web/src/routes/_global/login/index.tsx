import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';

import { getAuthControllerMeV1QueryKey, useAuthControllerLoginV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerLoginV1Body } from '#/.generated/api/zod/auth/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/_global/login/')({
  validateSearch: z.object({ callback: z.string().optional() }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { callback } = Route.useSearch();
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
      rememberMe: false,
    },
    validators: {
      onSubmit: AuthControllerLoginV1Body.extend({ rememberMe: z.boolean() }),
    },
    onSubmit: async ({ value }) => {
      try {
        await loginMutation.mutateAsync({
          data: {
            email: value.email.trim(),
            password: value.password,
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
            <CardDescription>서비스 계정으로 접속해 주세요.</CardDescription>
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
                <form.AppField name="rememberMe">
                  {(field) => (
                    <field.Checkbox
                      label="로그인 상태 유지 (30일)"
                    />
                  )}
                </form.AppField>
                <FormSubmit
                  className="w-full mt-2"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? '인증 확인 중...' : '로그인'}
                </FormSubmit>
              </FormLayout>
            </form.AppForm>
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
