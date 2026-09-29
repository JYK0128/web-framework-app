import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';

import { useAuthControllerGetPolicyV1, useAuthControllerLoginV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerLoginV1Body, authControllerLoginV1BodyTwoFactorCodeMax, authControllerLoginV1BodyTwoFactorCodeMin } from '#/.generated/api/zod/auth/auth';
import { Card, CardContent, Separator } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/_public/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const policyQuery = useAuthControllerGetPolicyV1();
  const codeLength = policyQuery.data?.data.twoFactorCodeLength ?? authControllerLoginV1BodyTwoFactorCodeMin;

  const loginMutation = useAuthControllerLoginV1({
    mutation: {
      onSuccess: async () => {
        await navigate({ to: '/profile', replace: true });
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
        twoFactorCode: z.string().refine((code) => !code || code.length === codeLength, `인증 코드는 ${codeLength}자리여야 합니다.`),
      }),
    },
    onSubmit: async ({ value }) => {
      try {
        await loginMutation.mutateAsync({
          data: {
            email: value.email.trim(),
            password: value.password,
            twoFactorCode: value.twoFactorCode.trim() || undefined,
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
                    {(policyQuery.isLoading || policyQuery.isError || policyQuery.data?.data.twoFactorAvailable) && (
                      <form.AppField name="twoFactorCode">
                        {(field) => (
                          <field.Input
                            type="text"
                            label="2단계 인증 코드 (설정한 계정만)"
                            placeholder={`${codeLength}자리 코드`}
                            autoComplete="one-time-code"
                            inputMode="numeric"
                            maxLength={Math.min(codeLength, authControllerLoginV1BodyTwoFactorCodeMax)}
                          />
                        )}
                      </form.AppField>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Separator
                      orientation="horizontal"
                      className="h-px w-full bg-border"
                    />
                    <div className="grid gap-6">
                      <div className="flex items-center justify-between gap-2">
                        <form.AppField name="rememberMe">
                          {(field) => <field.Checkbox label="로그인 유지" showError={false} />}
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
                      {policyQuery.data?.data.emailVerificationRequired && (
                        <Link
                          to="/email-verification"
                          search={{}}
                          className="
                            text-center text-xs text-muted-foreground
                            hover:text-foreground hover:underline
                          "
                        >
                          이메일 인증 메일 다시 받기
                        </Link>
                      )}
                      <FormSubmit className="w-full" disabled={loginMutation.isPending}>
                        <span>{loginMutation.isPending ? '인증 확인 중...' : '로그인'}</span>
                        <ArrowRight className="size-4" />
                      </FormSubmit>
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
