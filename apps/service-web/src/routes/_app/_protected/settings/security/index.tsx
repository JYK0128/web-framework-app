import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { toString as qrToString } from 'qrcode';
import { useEffect, useState } from 'react';

import { getAuthControllerMeV1QueryKey, useAuthControllerDisableTwoFactorV1, useAuthControllerEnableTwoFactorV1, useAuthControllerGenerateTwoFactorV1, useAuthControllerGetPolicyV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerEnableTwoFactorV1Body, authControllerEnableTwoFactorV1BodyCodeMin } from '#/.generated/api/zod/auth/auth';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { PageSection } from '#/components/layout';
import { authUserAtom } from '#/store/token';

export const Route = createFileRoute('/_app/_protected/settings/security/')({ component: SecuritySettingsPage });

function SecuritySettingsPage() {
  const user = useAtomValue(authUserAtom);
  const setUser = useSetAtom(authUserAtom);
  const queryClient = useQueryClient();
  const policyQuery = useAuthControllerGetPolicyV1();
  const setupMutation = useAuthControllerGenerateTwoFactorV1();
  const enableMutation = useAuthControllerEnableTwoFactorV1();
  const disableMutation = useAuthControllerDisableTwoFactorV1();
  const [secret, setSecret] = useState<string>();
  const [qrSvg, setQrSvg] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const enabled = Boolean(user?.twoFactorEnabled);
  const required = Boolean(user?.twoFactorRequired);
  const digits = setupMutation.data?.digits ?? policyQuery.data?.twoFactorDigits ?? authControllerEnableTwoFactorV1BodyCodeMin;
  const periodSeconds = setupMutation.data?.periodSeconds ?? 30;

  useEffect(() => {
    if (!secret) return;
    const appName = 'Service';
    const email = user?.email;
    const label = email ? `${appName}:${email}` : appName;
    const uri = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(appName)}&algorithm=SHA1&digits=${digits}&period=${periodSeconds}`;
    void qrToString(uri, { type: 'svg', margin: 1 }).then(setQrSvg).catch(() => setQrSvg(undefined));
  }, [digits, periodSeconds, secret, user?.email]);

  const form = useAppForm({
    defaultValues: { code: '' },
    validators: { onSubmit: AuthControllerEnableTwoFactorV1Body },
    onSubmit: async ({ value }) => {
      setErrorMessage(undefined);
      try {
        await enableMutation.mutateAsync({ data: value });
        setSecret(undefined);
        form.reset();
        queryClient.setQueryData(getAuthControllerMeV1QueryKey(), (current) => current ? { ...current, twoFactorEnabled: true } : current);
        setUser((current) => current ? { ...current, twoFactorEnabled: true } : current);
      }
      catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '2단계 인증을 활성화하지 못했습니다.');
      }
    },
  });

  const beginSetup = async () => {
    setErrorMessage(undefined);
    try {
      const result = await setupMutation.mutateAsync();
      setSecret(result.secret);
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '인증 키를 만들지 못했습니다.');
    }
  };

  const disable = async () => {
    setErrorMessage(undefined);
    try {
      await disableMutation.mutateAsync();
      queryClient.setQueryData(getAuthControllerMeV1QueryKey(), (current) => current ? { ...current, twoFactorEnabled: false } : current);
      setUser((current) => current ? { ...current, twoFactorEnabled: false } : current);
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '2단계 인증을 해제하지 못했습니다.');
    }
  };

  return (
    <div className="
      size-full px-6 py-8
      md:px-8
    "
    >
      <PageSection icon="shield-check" title="보안 설정" description="로그인에 사용할 2단계 인증을 관리합니다.">
        <PageSection.Content className="
          mx-auto grid w-full max-w-3xl gap-4 pt-2
        "
        >
          <Card>
            <CardHeader>
              <CardTitle>2단계 인증</CardTitle>
              <CardDescription>{required ? '서비스 보안 정책에 따라 로그인을 위해 설정이 필요합니다.' : '인증 앱으로 로그인 보안을 강화할 수 있습니다.'}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {!user && (
                <p className="text-sm text-muted-foreground">
                  보안 상태를 불러오는 중입니다.
                </p>
              )}
              {user && (
                <p
                  role="status"
                  className="text-sm"
                >
                  현재 상태:
                  {enabled ? '사용 중' : '미설정'}
                </p>
              )}
              {errorMessage && (
                <p
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {errorMessage}
                </p>
              )}
              {!enabled && !secret && <Button className="w-fit" onClick={() => void beginSetup()} disabled={setupMutation.isPending || !user}>{setupMutation.isPending ? '인증 키 생성 중...' : '2단계 인증 설정 시작'}</Button>}
              {!enabled && secret && (
                <>
                  <div className="grid gap-2 rounded-md border p-3">
                    <p className="text-sm">인증 앱에서 QR 코드를 스캔하거나 비밀키를 직접 등록하세요.</p>
                    {qrSvg && (
                      <div
                        className="
                          mx-auto rounded-lg border bg-white p-2
                          [&>svg]:size-44
                        "
                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                      />
                    )}
                    <code className="break-all select-all text-sm">{secret}</code>
                  </div>
                  <form.AppForm>
                    <FormLayout
                      id="service-two-factor-form"
                      onSubmit={() => void form.handleSubmit()}
                      className="gap-4"
                    >
                      <form.AppField name="code">{(field) => <field.OtpInput label={`인증 앱 코드 (${digits}자리)`} placeholder={'0'.repeat(digits)} maxLength={digits} required />}</form.AppField>
                      <FormSubmit className="w-fit" disabled={enableMutation.isPending}>{enableMutation.isPending ? '확인 중...' : '인증 켜기'}</FormSubmit>
                    </FormLayout>
                  </form.AppForm>
                </>
              )}
              {enabled && !required && (
                <Button
                  variant="outline"
                  className="w-fit"
                  onClick={() => void disable()}
                  disabled={disableMutation.isPending}
                >
                  {disableMutation.isPending ? '해제 중...' : '2단계 인증 해제'}
                </Button>
              )}
            </CardContent>
          </Card>
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
