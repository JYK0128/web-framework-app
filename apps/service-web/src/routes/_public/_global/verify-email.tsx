import { z } from '@pkg/shared/common';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Mail, ShieldCheck } from 'lucide-react';
import { type ReactNode } from 'react';

import { useAuthControllerResendEmailVerificationV1, useAuthControllerVerifyEmailV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button, Card, CardContent } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/_public/_global/verify-email')({
  validateSearch: z.object({
    challengeId: z.string().optional(),
    token: z.string().optional(),
  }),
  component: EmailVerificationPage,
});

function EmailVerificationPage() {
  const { challengeId = '', token = '' } = Route.useSearch();
  const requestMutation = useAuthControllerResendEmailVerificationV1();
  const verifyMutation = useAuthControllerVerifyEmailV1();

  const form = useAppForm({
    defaultValues: { email: '' },
    validators: { onSubmit: z.object({ email: z.email('올바른 이메일 주소를 입력해 주세요.') }) },
    onSubmit: async ({ value }) => {
      await requestMutation.mutateAsync({ data: { email: value.email.trim().toLowerCase() } });
    },
  });

  const verify = () => {
    verifyMutation.mutate({ data: { challengeId, token } });
  };

  const isCompletingVerification = Boolean(challengeId || token);
  let verificationContent: ReactNode;
  if (isCompletingVerification && verifyMutation.isSuccess) {
    verificationContent = (
      <p role="status" className="text-center text-sm text-primary">
        로그인하여 계속 진행해 주세요.
      </p>
    );
  }
  else if (isCompletingVerification) {
    verificationContent = (
      <Button onClick={verify} disabled={!challengeId || !token || verifyMutation.isPending}>
        {verifyMutation.isPending ? '인증 중...' : '이메일 인증 완료'}
      </Button>
    );
  }
  else if (requestMutation.isSuccess) {
    verificationContent = (
      <p role="status" className="text-center text-sm">
        이메일의 인증 링크를 확인해 주세요.
      </p>
    );
  }
  else {
    verificationContent = (
      <form.AppForm>
        <FormLayout
          onSubmit={() => void form.handleSubmit()}
          className="grid gap-4"
        >
          <form.AppField name="email">
            {(field) => <field.Input type="email" label="이메일" placeholder="user@example.com" autoComplete="email" required />}
          </form.AppField>
          <form.Submit disabled={requestMutation.isPending}>{requestMutation.isPending ? '요청 중...' : '인증 메일 받기'}</form.Submit>
        </FormLayout>
      </form.AppForm>
    );
  }

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
                {isCompletingVerification ? '계정 이메일 주소를 확인해 주세요.' : '계정 이메일 주소로 인증 링크를 보내드립니다.'}
              </p>
            </div>

            {verificationContent}

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
