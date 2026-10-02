import { ApplicationError, getValidationFieldErrors } from '@pkg/shared/common';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';

import { useAuthControllerRequestPasswordResetV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerRequestPasswordResetV1Body } from '#/.generated/api/zod/auth/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/_public/_global/forgot-password/')({ component: ForgotPasswordPage });

function ForgotPasswordPage() {
  const mutation = useAuthControllerRequestPasswordResetV1();
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const form = useAppForm({
    defaultValues: { email: '' },
    validators: { onSubmit: AuthControllerRequestPasswordResetV1Body },
    onSubmit: async ({ value }) => {
      setErrorMessage(undefined);
      try {
        await mutation.mutateAsync({ data: { email: value.email.trim() } });
        setSubmitted(true);
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) form.setErrorMap({ onSubmit: { fields: getValidationFieldErrors(error.details) } });
        setErrorMessage(error instanceof Error ? error.message : '요청을 처리하지 못했습니다.');
      }
    },
  });

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full max-w-md shadow-xl border border-border/40">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">비밀번호 재설정</CardTitle>
            <CardDescription>계정 이메일로 재설정 링크를 보내드립니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {submitted
              ? (
                <div className="grid gap-4">
                  <p role="status" className="text-sm">계정이 존재하면 비밀번호 재설정 메일을 보냈습니다.</p>
                  <Link
                    to="/login"
                    className="text-sm underline underline-offset-4"
                  >
                    로그인으로 이동
                  </Link>
                </div>
              )
              : (
                <form.AppForm>
                  <FormLayout
                    id="forgot-password-form"
                    onSubmit={() => void form.handleSubmit()}
                    className="gap-4"
                  >
                    {errorMessage && (
                      <p
                        role="alert"
                        className="text-sm text-destructive"
                      >
                        {errorMessage}
                      </p>
                    )}
                    <form.AppField name="email">{(field) => <field.Input type="email" label="이메일" autoComplete="email" required />}</form.AppField>
                    <FormSubmit className="w-full" disabled={mutation.isPending}>{mutation.isPending ? '요청 중...' : '재설정 메일 보내기'}</FormSubmit>
                    <Link
                      to="/login"
                      className="
                        text-center text-sm underline underline-offset-4
                      "
                    >
                      로그인으로 돌아가기
                    </Link>
                  </FormLayout>
                </form.AppForm>
              )}
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
