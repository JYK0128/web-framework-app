import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, redirect, useLocation, useRouter } from '@tanstack/react-router';

import { getAuthControllerMeV1QueryKey, useAuthControllerCompleteTwoFactorLoginV1, useAuthControllerGetPolicyV1 } from '#/.generated/api/endpoints/auth/auth';
import { authControllerCompleteTwoFactorLoginV1BodyCodeMax, authControllerCompleteTwoFactorLoginV1BodyCodeMin } from '#/.generated/api/zod/auth/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/_public/_global/login/2fa')({
  validateSearch: z.object({ callback: z.string().optional() }),
  beforeLoad: ({ location }) => {
    if (!location.state.twoFactorChallengeToken) throw redirect({ to: '/login', replace: true });
  },
  component: TwoFactorLoginPage,
});

function TwoFactorLoginPage() {
  const router = useRouter();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { callback } = Route.useSearch();
  const policyQuery = useAuthControllerGetPolicyV1();
  const mutation = useAuthControllerCompleteTwoFactorLoginV1();
  const challengeToken = location.state.twoFactorChallengeToken;
  const digits = Math.min(policyQuery.data?.twoFactorDigits ?? authControllerCompleteTwoFactorLoginV1BodyCodeMin, authControllerCompleteTwoFactorLoginV1BodyCodeMax);

  const form = useAppForm({
    defaultValues: { code: '' },
    validators: {
      onSubmit: z.object({ code: z.string().length(digits, `인증 코드는 ${digits}자리여야 합니다.`) }),
    },
    onSubmit: async ({ value }) => {
      if (!challengeToken) {
        await router.navigate({ to: '/login', search: { callback }, replace: true });
        return;
      }
      try {
        await mutation.mutateAsync({ data: { twoFactorChallengeToken: challengeToken, code: value.code } });
        await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
        await router.invalidate();
        router.history.replace(resolveDestination(callback));
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) {
          form.setErrorMap({ onSubmit: { fields: getValidationFieldErrors(error.details) } });
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
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">2단계 인증</CardTitle>
            <CardDescription>
              인증 앱에 표시된
              {digits}
              자리 코드를 입력해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form.AppForm>
              <FormLayout
                id="service-login-two-factor-form"
                onSubmit={() => void form.handleSubmit()}
                className="gap-4"
              >
                <form.AppField name="code">
                  {(field) => (
                    <field.OtpInput
                      label="인증 코드"
                      aria-label="2단계 인증 코드"
                      maxLength={digits}
                      autoComplete="one-time-code"
                      required
                    />
                  )}
                </form.AppField>
                <FormSubmit className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? '확인 중...' : '로그인'}
                </FormSubmit>
                <div className="text-center text-sm">
                  <Link
                    to="/login"
                    search={{ callback }}
                    className="underline underline-offset-4"
                  >
                    로그인으로 돌아가기
                  </Link>
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
