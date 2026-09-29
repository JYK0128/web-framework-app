import { ApplicationError, getValidationFieldErrors, z } from '@pkg/shared/common';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';

import { useAuthControllerGetPolicyV1, useAuthControllerRegisterV1, useAuthControllerResendEmailVerificationV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerRegisterV1Body } from '#/.generated/api/zod/auth/auth';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { ScreenLayout } from '#/components/layout';
import { describePasswordPolicy, getPasswordPolicyError } from '#/lib/password-policy';

export const Route = createFileRoute('/_global/register/')({ component: RegisterPage });

function RegisterPage() {
  const registerMutation = useAuthControllerRegisterV1();
  const policyQuery = useAuthControllerGetPolicyV1();
  const resendMutation = useAuthControllerResendEmailVerificationV1();
  const [registered, setRegistered] = useState<{ email: string, verificationRequired: boolean, emailSent: boolean }>();
  const [errorMessage, setErrorMessage] = useState<string>();

  const form = useAppForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    validators: {
      onSubmit: AuthControllerRegisterV1Body.extend({ password: z.string(), confirmPassword: z.string() })
        .superRefine((value, context) => {
          const passwordError = getPasswordPolicyError(value.password, policyQuery.data?.data);
          if (passwordError) context.addIssue({ code: 'custom', path: ['password'], message: passwordError });
          if (value.password !== value.confirmPassword) {
            context.addIssue({ code: 'custom', path: ['confirmPassword'], message: '비밀번호가 일치하지 않습니다.' });
          }
        }),
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(undefined);
      try {
        const response = await registerMutation.mutateAsync({ data: { name: value.name, email: value.email.trim(), password: value.password } });
        setRegistered({ email: value.email.trim(), verificationRequired: response.data.emailVerificationRequired, emailSent: response.data.verificationEmailSent });
      }
      catch (error) {
        if (error instanceof ApplicationError && error.details) {
          form.setErrorMap({ onSubmit: { fields: getValidationFieldErrors(error.details) } });
        }
        setErrorMessage(error instanceof Error ? error.message : '회원가입을 완료하지 못했습니다.');
      }
    },
  });

  const resend = async () => {
    if (!registered) return;
    try {
      await resendMutation.mutateAsync({ data: { email: registered.email } });
      setRegistered({ ...registered, emailSent: true });
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '인증 메일을 다시 보내지 못했습니다.');
    }
  };

  const renderRegistrationContent = () => {
    if (registered) {
      return (
        <div className="grid gap-4">
          <p role="status" className="text-sm">{getRegistrationCompleteMessage(registered)}</p>
          {registered.verificationRequired && <Button variant="outline" onClick={() => void resend()} disabled={resendMutation.isPending}>인증 메일 다시 보내기</Button>}
          <Link to="/login" className="text-sm underline underline-offset-4">로그인으로 이동</Link>
        </div>
      );
    }

    if (policyQuery.isLoading) {
      return <p className="text-sm text-muted-foreground">가입 정책을 확인하고 있습니다.</p>;
    }

    if (policyQuery.isError) {
      return (
        <div className="grid gap-4">
          <p role="alert" className="text-sm text-destructive">가입 정책을 확인하지 못했습니다.</p>
          <Button variant="outline" onClick={() => void policyQuery.refetch()}>다시 확인</Button>
        </div>
      );
    }

    if (!policyQuery.data?.data.credentialRegistrationAvailable) {
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
          id="service-register-form"
          onSubmit={() => void form.handleSubmit()}
          className="gap-4"
        >
          {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
          <p className="text-sm text-muted-foreground">{describePasswordPolicy(policyQuery.data.data)}</p>
          <form.AppField name="name">{(field) => <field.Input label="이름" autoComplete="name" required />}</form.AppField>
          <form.AppField name="email">{(field) => <field.Input type="email" label="이메일" autoComplete="email" required />}</form.AppField>
          <form.AppField name="password">{(field) => <field.Input type="password" label="비밀번호" minLength={policyQuery.data.data.passwordMinLength} maxLength={policyQuery.data.data.passwordMaxLength} autoComplete="new-password" required />}</form.AppField>
          <form.AppField name="confirmPassword">{(field) => <field.Input type="password" label="비밀번호 확인" autoComplete="new-password" required />}</form.AppField>
          <FormSubmit className="w-full" disabled={registerMutation.isPending}>{registerMutation.isPending ? '가입 처리 중...' : '회원가입'}</FormSubmit>
        </FormLayout>
      </form.AppForm>
    );
  };

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full max-w-md shadow-xl border border-border/40">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">회원가입</CardTitle>
            <CardDescription>서비스 계정을 만들어 주세요.</CardDescription>
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
  if (!registered.verificationRequired) return '회원가입이 완료됐습니다. 로그인할 수 있습니다.';
  if (registered.emailSent) return `${registered.email} 주소로 인증 메일을 보냈습니다.`;
  return '계정은 생성됐지만 인증 메일을 보내지 못했습니다.';
}
