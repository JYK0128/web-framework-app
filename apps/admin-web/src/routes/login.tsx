import { ApplicationError, TimeUtil, z } from '@pkg/shared/common';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { isAxiosError } from 'axios';

import { getAuthControllerMeV1QueryOptions, useAuthControllerLoginV1 } from '#/.generated/api/endpoints/auth/auth';
import { getTermsControllerGetAgreementsV1QueryOptions } from '#/.generated/api/endpoints/terms/terms';
import { AuthControllerLoginV1Body } from '#/.generated/api/zod/auth/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ context }) => {
    const response = await context.queryClient
      .fetchQuery(getAuthControllerMeV1QueryOptions({
        query: { staleTime: TimeUtil.ms.minute(1) },
      }))
      .catch((error: unknown) => {
        if (error instanceof ApplicationError && error.status === 401) return null;
        if (isAxiosError(error) && error.response?.status === 401) return null;
        throw error;
      });

    if (!response) return;

    const agreements = await context.queryClient.fetchQuery(
      getTermsControllerGetAgreementsV1QueryOptions(undefined, {
        query: { staleTime: TimeUtil.ms.minute(1) },
      }),
    );
    const hasUnagreedRequiredTerm = agreements.data.items.some(
      (term) => term.isRequired && !term.isAgreed,
    );

    throw redirect({ to: hasUnagreedRequiredTerm ? '/onboarding/terms' : '/profile' });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const loginMutation = useAuthControllerLoginV1({
    mutation: {
      meta: { successMessage: '로그인에 성공했습니다.' },
      onSuccess: async () => {
        await navigate({ to: '/profile', replace: true });
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
          form.setErrorMap({
            onSubmit: error.details as never,
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
            <CardTitle className="text-2xl font-bold tracking-tight">관리자 로그인</CardTitle>
            <CardDescription>시스템 관리자 계정으로 접속해 주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form.AppForm>
              <FormLayout
                id="admin-login-form"
                onSubmit={() => void form.handleSubmit()}
                className="gap-4"
              >
                <form.AppField name="email">
                  {(field) => (
                    <field.Input
                      type="email"
                      label="이메일"
                      placeholder="admin@example.com"
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
