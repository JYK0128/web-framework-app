import { z } from '@pkg/shared/common';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { useAuthControllerResetPasswordV1 } from '#/.generated/api/endpoints/auth/auth';
import { Card, CardContent } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { LinkButton, ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/_public/reset-password')({
  validateSearch: z.object({
    challengeId: z.string().optional(),
    token: z.string().optional(),
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { challengeId = '', token = '' } = Route.useSearch();
  const [done, setDone] = useState(false);
  const reset = useAuthControllerResetPasswordV1();
  const form = useAppForm({
    defaultValues: { password: '' },
    validators: { onSubmit: z.object({ password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.') }) },
    onSubmit: async ({ value }) => {
      await reset.mutateAsync({ data: { challengeId, token, newPassword: value.password } });
      setDone(true);
    },
  });

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
                <form.AppForm>
                  <FormLayout
                    onSubmit={() => void form.handleSubmit()}
                    className="grid gap-4"
                  >
                    <form.AppField name="password">
                      {(field) => <field.Input type="password" label="새 비밀번호" placeholder="8자 이상" required />}
                    </form.AppField>
                    <form.Submit disabled={!challengeId || !token || reset.isPending}>비밀번호 변경</form.Submit>
                  </FormLayout>
                </form.AppForm>
              )}
            <LinkButton variant="ghost" to="/login">로그인으로 돌아가기</LinkButton>
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
