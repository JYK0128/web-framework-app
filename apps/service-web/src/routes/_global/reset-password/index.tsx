import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';

import { useAuthControllerGetPolicyV1, useAuthControllerResetPasswordV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerResetPasswordV1Body } from '#/.generated/api/zod/auth/auth';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';
import { describePasswordPolicy, getPasswordPolicyError } from '#/lib/password-policy';

export const Route = createFileRoute('/_global/reset-password/')({
  validateSearch: (search: Record<string, unknown>) => ({ challengeId: typeof search.challengeId === 'string' ? search.challengeId : '', token: typeof search.token === 'string' ? search.token : '' }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { challengeId, token } = Route.useSearch();
  const policyQuery = useAuthControllerGetPolicyV1();
  const mutation = useAuthControllerResetPasswordV1();
  const [complete, setComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const form = useAppForm({
    defaultValues: { newPassword: '', confirmPassword: '' },
    validators: {
      onSubmit: AuthControllerResetPasswordV1Body.pick({ newPassword: true }).extend({ newPassword: z.string(), confirmPassword: z.string() })
        .superRefine((value, context) => {
          const passwordError = getPasswordPolicyError(value.newPassword, policyQuery.data);
          if (passwordError) context.addIssue({ code: 'custom', path: ['newPassword'], message: passwordError });
          if (value.newPassword !== value.confirmPassword) {
            context.addIssue({ code: 'custom', path: ['confirmPassword'], message: '비밀번호가 일치하지 않습니다.' });
          }
        }),
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(undefined);
      try {
        await mutation.mutateAsync({ data: { challengeId, token, newPassword: value.newPassword } });
        setComplete(true);
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) form.setErrorMap({ onSubmit: { fields: getValidationFieldErrors(error.details) } });
        setErrorMessage(error instanceof Error ? error.message : '비밀번호를 변경하지 못했습니다.');
      }
    },
  });

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full max-w-md shadow-xl border border-border/40">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">새 비밀번호 설정</CardTitle>
            <CardDescription>새 비밀번호를 입력해 주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            {complete
              ? (
                <div className="grid gap-4">
                  <p role="status" className="text-sm">비밀번호를 변경했습니다.</p>
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
                    id="reset-password-form"
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
                    <p className="text-sm text-muted-foreground">{describePasswordPolicy(policyQuery.data)}</p>
                    {(!challengeId || !token) && (
                      <p
                        role="alert"
                        className="text-sm text-destructive"
                      >
                        재설정 링크에 필요한 정보가 없습니다.
                      </p>
                    )}
                    <form.AppField name="newPassword">{(field) => <field.Input type="password" label="새 비밀번호" minLength={policyQuery.data?.passwordMinLength} maxLength={policyQuery.data?.passwordMaxLength} autoComplete="new-password" required />}</form.AppField>
                    <form.AppField name="confirmPassword">{(field) => <field.Input type="password" label="새 비밀번호 확인" autoComplete="new-password" required />}</form.AppField>
                    <FormSubmit className="w-full" disabled={mutation.isPending || !challengeId || !token || !policyQuery.data}>{mutation.isPending ? '변경 중...' : '비밀번호 변경'}</FormSubmit>
                  </FormLayout>
                </form.AppForm>
              )}
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
