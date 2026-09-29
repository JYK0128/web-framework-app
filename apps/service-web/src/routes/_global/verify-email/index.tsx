import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';

import { useAuthControllerVerifyEmailV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/_global/verify-email/')({
  validateSearch: (search: Record<string, unknown>) => ({
    challengeId: typeof search.challengeId === 'string' ? search.challengeId : '',
    token: typeof search.token === 'string' ? search.token : '',
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { challengeId, token } = Route.useSearch();
  const verifyMutation = useAuthControllerVerifyEmailV1();
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const verify = async () => {
    setErrorMessage(undefined);
    try {
      await verifyMutation.mutateAsync({ data: { challengeId, token } });
      setVerified(true);
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '이메일 인증 링크가 유효하지 않거나 만료됐습니다.');
    }
  };

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full max-w-md shadow-xl border border-border/40">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">이메일 인증</CardTitle>
            <CardDescription>이메일 주소를 확인해 주세요.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {errorMessage && (
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {errorMessage}
              </p>
            )}
            {verified
              ? (
                <>
                  <p role="status" className="text-sm">이메일 인증이 완료됐습니다.</p>
                  <Link
                    to="/login"
                    className="text-sm underline underline-offset-4"
                  >
                    로그인으로 이동
                  </Link>
                </>
              )
              : <Button onClick={() => void verify()} disabled={!challengeId || !token || verifyMutation.isPending}>{verifyMutation.isPending ? '인증 중...' : '이메일 인증 완료'}</Button>}
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
