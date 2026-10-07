import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { createFileRoute, Link } from '@tanstack/react-router';

import { useAuthControllerGetPolicyV1, useAuthControllerRegisterV1, useAuthControllerRequestEmailVerificationV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerRegisterV1Body } from '#/.generated/api/zod/auth/auth';
import { Button, Card, CardContent, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';
import { describePasswordPolicy, getPasswordPolicyError } from '#/lib/password-policy';

export const Route = createFileRoute('/_public/_global/register')({ component: RegisterPage });

function RegisterPage() {
  const policyQuery = useAuthControllerGetPolicyV1();
  const registerMutation = useAuthControllerRegisterV1();
  const requestVerificationMutation = useAuthControllerRequestEmailVerificationV1();

  const form = useAppForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    validators: {
      onSubmit: AuthControllerRegisterV1Body.extend({ password: z.string(), confirmPassword: z.string() })
        .superRefine((value, context) => {
          const passwordError = getPasswordPolicyError(value.password, policyQuery.data);
          if (passwordError) context.addIssue({ code: 'custom', path: ['password'], message: passwordError });
          if (value.password !== value.confirmPassword) {
            context.addIssue({ code: 'custom', path: ['confirmPassword'], message: '비밀번호가 일치하지 않습니다.' });
          }
        }),
    },
    onSubmit: async ({ value }) => {
      try {
        const email = value.email.trim().toLowerCase();
        await registerMutation.mutateAsync({ data: { name: value.name, email, password: value.password } });
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) {
          form.setErrorMap({ onSubmit: { fields: getValidationFieldErrors(error.details) } });
        }
      }
    },
  });

  const registered = registerMutation.data && {
    email: registerMutation.variables?.data.email ?? '',
    verificationRequired: registerMutation.data.emailVerificationRequired,
    emailSent: requestVerificationMutation.isSuccess || registerMutation.data.verificationEmailSent,
  };

  const resendVerification = () => {
    if (registered) requestVerificationMutation.mutate({ data: { email: registered.email } });
  };

  const renderRegistrationContent = () => {
    if (registered) {
      return (
        <div className="grid gap-4">
          <p role="status" className="text-sm">
            {getRegistrationCompleteMessage(registered)}
          </p>
          {registered.verificationRequired && (
            <Button
              variant="outline"
              onClick={resendVerification}
              disabled={requestVerificationMutation.isPending}
            >
              {requestVerificationMutation.isPending ? '요청 중...' : '인증 메일 다시 보내기'}
            </Button>
          )}
          <Link to="/login" className="text-sm underline underline-offset-4">로그인으로 이동</Link>
        </div>
      );
    }

    if (policyQuery.isLoading) {
      return <p role="status" className="text-sm text-muted-foreground">가입 정책을 확인하고 있습니다.</p>;
    }

    if (policyQuery.isError) {
      return (
        <div className="grid gap-4">
          <p role="alert" className="text-sm text-destructive">가입 정책을 확인하지 못했습니다.</p>
          <Button variant="outline" onClick={() => void policyQuery.refetch()}>다시 확인</Button>
        </div>
      );
    }

    if (!policyQuery.data?.credentialRegistrationAvailable) {
      return (
        <div className="grid gap-4">
          <p role="status" className="text-sm">현재 회원가입을 사용할 수 없습니다.</p>
          <Link to="/login" className="text-sm underline underline-offset-4">로그인으로 이동</Link>
        </div>
      );
    }

    return (
      <form.AppForm>
        <FormLayout
          id="admin-register-form"
          onSubmit={() => void form.handleSubmit()}
          className="gap-4"
        >
          <p className="text-sm text-muted-foreground">{describePasswordPolicy(policyQuery.data)}</p>
          <form.AppField name="name">
            {(field) => <field.Input label="이름" autoComplete="name" required />}
          </form.AppField>
          <form.AppField name="email">
            {(field) => <field.Input type="email" label="이메일" autoComplete="email" required />}
          </form.AppField>
          <form.AppField name="password">
            {(field) => (
              <field.Input
                type="password"
                label="비밀번호"
                minLength={policyQuery.data.passwordMinLength}
                maxLength={policyQuery.data.passwordMaxLength}
                autoComplete="new-password"
                required
              />
            )}
          </form.AppField>
          <form.AppField name="confirmPassword">
            {(field) => <field.Input type="password" label="비밀번호 확인" autoComplete="new-password" required />}
          </form.AppField>
          <FormSubmit className="w-full" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? '가입 처리 중...' : '회원가입'}
          </FormSubmit>
        </FormLayout>
      </form.AppForm>
    );
  };

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">회원가입</CardTitle>
          </CardHeader>
          <CardContent>
            {renderRegistrationContent()}
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}

function getRegistrationCompleteMessage(registered: { email: string, verificationRequired: boolean, emailSent: boolean }): string {
  if (!registered.verificationRequired) return '로그인하여 계속 진행해 주세요.';
  if (registered.emailSent) return `${registered.email} 주소의 인증 링크를 확인해 주세요.`;
  return '로그인하려면 이메일 인증이 필요합니다. 인증 메일을 다시 요청해 주세요.';
}
