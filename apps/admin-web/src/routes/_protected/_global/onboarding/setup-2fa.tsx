import { z } from '@pkg/shared/common';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Copy } from 'lucide-react';
import { toString as qrToString } from 'qrcode';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getAuthControllerMeV1QueryKey, useAuthControllerEnableTwoFactorV1, useAuthControllerGenerateTwoFactorV1 } from '#/.generated/api/endpoints/auth/auth';
import { AuthControllerEnableTwoFactorV1Body, authControllerEnableTwoFactorV1BodyCodeMin } from '#/.generated/api/zod/auth/auth';
import { Button, InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';

import { OnboardingLayout } from './-components/onboarding-layout';

export const Route = createFileRoute('/_protected/_global/onboarding/setup-2fa')({
  validateSearch: z.object({ callback: z.string().optional() }),
  component: TwoFactorOnboardingPage,
});

function TwoFactorOnboardingPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = Route.useRouteContext();
  const generate = useAuthControllerGenerateTwoFactorV1();
  const enable = useAuthControllerEnableTwoFactorV1();
  const [qrSvg, setQrSvg] = useState<string>();
  const generatedRef = useRef(false);
  const digits = generate.data?.digits ?? authControllerEnableTwoFactorV1BodyCodeMin;
  const periodSeconds = generate.data?.periodSeconds ?? 30;
  const secret = generate.data?.secret;
  const form = useAppForm({
    defaultValues: { code: '' },
    validators: { onSubmit: AuthControllerEnableTwoFactorV1Body },
    onSubmit: async ({ value }) => {
      await enable.mutateAsync({ data: value });
      queryClient.setQueryData(getAuthControllerMeV1QueryKey(), (current) => current ? { ...current, twoFactorEnabled: true } : current);
      await router.invalidate();
    },
  });

  useEffect(() => {
    if (generatedRef.current) return;
    generatedRef.current = true;
    generate.mutate();
  }, [generate]);

  useEffect(() => {
    if (!secret) return;
    const label = user?.email ? `Admin:${user.email}` : 'Admin';
    const uri = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=Admin&algorithm=SHA1&digits=${digits}&period=${periodSeconds}`;
    void qrToString(uri, { type: 'svg', margin: 1 }).then(setQrSvg).catch(() => setQrSvg(undefined));
  }, [digits, periodSeconds, secret, user?.email]);

  const copySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      toast.success('2단계 인증 비밀키를 복사했습니다.');
    }
    catch {
      toast.error('비밀키를 복사하지 못했습니다.');
    }
  };

  return (
    <form.AppForm>
      <OnboardingLayout
        icon="shield-check"
        title="2단계 인증 설정"
        description="인증 앱을 등록하고 확인 코드를 입력해 계정을 보호하세요."
        footer={(
          <FormSubmit
            form="admin-two-factor-form"
            className="w-full"
            disabled={enable.isPending || !secret}
          >
            {enable.isPending ? '확인 중...' : '2단계 인증 활성화'}
          </FormSubmit>
        )}
      >
        <p className="text-sm text-muted-foreground">
          인증 앱으로 QR 코드를 스캔한 뒤 표시되는
          {digits}
          자리 코드를 입력하세요.
        </p>
        {!secret && (
          <p
            role={generate.isError ? 'alert' : 'status'}
            className={generate.isError
              ? `text-sm text-destructive`
              : `text-sm text-muted-foreground`}
          >
            {generate.isError ? '설정용 비밀키를 만들지 못했습니다.' : '설정용 비밀키를 생성하고 있습니다.'}
          </p>
        )}
        {generate.isError && <Button type="button" variant="outline" disabled={generate.isPending} onClick={() => generate.mutate()}>다시 시도</Button>}
        {secret && (
          <>
            {qrSvg && (
              <div
                className="
                  mx-auto rounded-lg border bg-white p-2
                  [&>svg]:size-44
                "
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            )}
            <InputGroup>
              <InputGroupInput aria-label="2단계 인증 비밀키" value={secret} readOnly />
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-sm" aria-label="비밀키 복사" title="비밀키 복사" onClick={() => void copySecret()}>
                  <Copy className="size-4" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <FormLayout
              id="admin-two-factor-form"
              onSubmit={() => void form.handleSubmit()}
              className="grid gap-4"
            >
              <form.AppField name="code">{(field) => <field.OtpInput label={`인증 코드 (${digits}자리)`} maxLength={digits} required />}</form.AppField>
            </FormLayout>
          </>
        )}
      </OnboardingLayout>
    </form.AppForm>
  );
}
