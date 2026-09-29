import { z } from '@pkg/shared/common';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { useAuthControllerRequestEmailVerificationV1, useAuthControllerVerifyEmailV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button, Card, CardContent } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/_public/email-verification')({
  validateSearch: z.object({
    challengeId: z.string().optional(),
    token: z.string().optional(),
  }),
  component: EmailVerificationPage,
});

function EmailVerificationPage() {
  const { challengeId = '', token = '' } = Route.useSearch();
  const [requestSent, setRequestSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const requestMutation = useAuthControllerRequestEmailVerificationV1();
  const verifyMutation = useAuthControllerVerifyEmailV1();

  const form = useAppForm({
    defaultValues: { email: '' },
    validators: { onSubmit: z.object({ email: z.email('올바른 이메일 주소를 입력해 주세요.') }) },
    onSubmit: async ({ value }) => {
      setErrorMessage(undefined);
      try {
        await requestMutation.mutateAsync({ data: { email: value.email.trim().toLowerCase() } });
        setRequestSent(true);
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '인증 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    },
  });

  const verify = async () => {
    setErrorMessage(undefined);
    try {
      await verifyMutation.mutateAsync({ data: { challengeId, token } });
      setVerified(true);
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '인증 링크가 유효하지 않거나 만료됐습니다.');
    }
  };

  const isCompletingVerification = Boolean(challengeId || token);

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="grid gap-5 p-6">
            <div className="grid justify-items-center gap-2 text-center">
              <div className="
                flex size-12 items-center justify-center rounded-2xl bg-primary
                text-primary-foreground
              "
              >
                {isCompletingVerification
                  ? <ShieldCheck className="size-6" />
                  : (
                    <Mail className="size-6" />
                  )}
              </div>
              <h1 className="text-xl font-bold tracking-tight">이메일 인증</h1>
              <p className="text-sm text-muted-foreground">
                {isCompletingVerification ? '관리자 계정 이메일 주소를 확인해 주세요.' : '계정 이메일 주소로 인증 링크를 보내드립니다.'}
              </p>
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {errorMessage}
              </p>
            )}

            {isCompletingVerification
              ? (
                verified
                  ? (
                    <p
                      role="status"
                      className="text-center text-sm text-primary"
                    >
                      이메일 인증이 완료됐습니다.
                    </p>
                  )
                  : <Button onClick={() => void verify()} disabled={!challengeId || !token || verifyMutation.isPending}>{verifyMutation.isPending ? '인증 중...' : '이메일 인증 완료'}</Button>
              )
              : requestSent
                ? <p role="status" className="text-center text-sm">요청이 처리됐습니다. 계정이 있고 인증이 필요하면 이메일로 인증 링크를 보내드립니다.</p>
                : (
                  <form.AppForm>
                    <FormLayout
                      onSubmit={() => void form.handleSubmit()}
                      className="grid gap-4"
                    >
                      <form.AppField name="email">
                        {(field) => <field.Input type="email" label="이메일" placeholder="operator@example.com" autoComplete="email" required />}
                      </form.AppField>
                      <form.Submit disabled={requestMutation.isPending}>{requestMutation.isPending ? '요청 중...' : '인증 메일 받기'}</form.Submit>
                    </FormLayout>
                  </form.AppForm>
                )}

            <Link
              to="/login"
              className="
                text-center text-sm text-muted-foreground underline
                underline-offset-4
              "
            >
              로그인으로 돌아가기
            </Link>
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
