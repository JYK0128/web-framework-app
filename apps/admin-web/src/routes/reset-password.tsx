import { z } from '@pkg/shared/common';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';

import { useAuthControllerResetPasswordV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button, Card, CardContent, Input } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/reset-password')({
  validateSearch: z.object({
    challengeId: z.string().optional(),
    token: z.string().optional(),
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { challengeId = '', token = '' } = Route.useSearch();
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const reset = useAuthControllerResetPasswordV1({ mutation: { onSuccess: () => setDone(true) } });

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="grid gap-4 p-6">
            <h1 className="text-xl font-bold">비밀번호 재설정</h1>
            {done
              ? (
                <p className="text-sm text-primary">
                  비밀번호가 변경되었습니다.
                </p>
              )
              : (
                <>
                  <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="새 비밀번호 (8자 이상)" />
                  <Button disabled={!challengeId || !token || password.length < 8 || reset.isPending} onClick={() => reset.mutate({ data: { challengeId, token, newPassword: password } })}>비밀번호 변경</Button>
                </>
              )}
            <Button variant="ghost" render={<Link to="/login" />}>로그인으로 돌아가기</Button>
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
