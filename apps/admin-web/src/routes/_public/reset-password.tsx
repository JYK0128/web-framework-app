import { z } from '@pkg/shared/common';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { useAuthControllerGetPolicyV1, useAuthControllerResetPasswordV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button, Card, CardContent } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { LinkButton, ScreenLayout } from '#/components/layout';
import { describePasswordPolicy, getPasswordPolicyError } from '#/lib/password-policy';

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
  const policyQuery = useAuthControllerGetPolicyV1();
  const reset = useAuthControllerResetPasswordV1();
  const form = useAppForm({
    defaultValues: { password: '' },
    validators: {
      onSubmit: z.object({ password: z.string() }).superRefine((value, context) => {
        const passwordError = getPasswordPolicyError(value.password, policyQuery.data);
        if (passwordError) context.addIssue({ code: 'custom', path: ['password'], message: passwordError });
      }),
    },
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
                    <p className="text-sm text-muted-foreground">{describePasswordPolicy(policyQuery.data)}</p>
                    {!policyQuery.data && (policyQuery.isError
                      ? (
                        <div className="grid gap-2">
                          <p role="alert" className="text-sm text-destructive">비밀번호 정책을 불러오지 못했습니다.</p>
                          <Button type="button" variant="outline" onClick={() => void policyQuery.refetch()}>정책 다시 불러오기</Button>
                        </div>
                      )
                      : (
                        <p
                          role="status"
                          className="text-sm text-muted-foreground"
                        >
                          비밀번호 정책을 확인하고 있습니다.
                        </p>
                      ))}
                    <form.AppField name="password">
                      {(field) => <field.Input type="password" label="새 비밀번호" placeholder={policyQuery.data ? `${policyQuery.data.passwordMinLength}자 이상` : '정책 확인 중'} minLength={policyQuery.data?.passwordMinLength} maxLength={policyQuery.data?.passwordMaxLength} autoComplete="new-password" required />}
                    </form.AppField>
                    <form.Submit disabled={!challengeId || !token || reset.isPending || !policyQuery.data}>비밀번호 변경</form.Submit>
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
