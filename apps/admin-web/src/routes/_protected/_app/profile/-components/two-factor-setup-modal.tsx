import { z } from '@pkg/shared/common';
import { Copy } from 'lucide-react';
import { toString as qrToString } from 'qrcode';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAuthControllerEnableTwoFactorV1, useAuthControllerGenerateTwoFactorV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button, InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

export function ProfileTwoFactorSetupModal({ open, onOpenChange, close, email }: ModalComponentProps<boolean> & { email?: string }) {
  const generate = useAuthControllerGenerateTwoFactorV1();
  const enable = useAuthControllerEnableTwoFactorV1();
  const digits = generate.data?.digits ?? 6;
  const periodSeconds = generate.data?.periodSeconds ?? 30;
  const form = useAppForm({
    defaultValues: { code: '' },
    validators: { onSubmit: z.object({ code: z.string().length(digits, `인증 코드는 ${digits}자리여야 합니다.`) }) },
    onSubmit: async ({ value }) => {
      await enable.mutateAsync({ data: value });
      close?.(true);
    },
  });
  const { mutate: generateSecret } = generate;
  useEffect(() => {
    // StrictMode의 effect 재실행이 끝난 뒤 초기 키를 한 번 발급한다.
    const timeoutId = setTimeout(() => generateSecret(), 0);
    return () => clearTimeout(timeoutId);
  }, [generateSecret]);

  const secret = generate.data?.secret;
  const [qrSvg, setQrSvg] = useState<string>();

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

  useEffect(() => {
    if (!secret) return;
    const appName = 'Admin';
    const label = email ? `${appName}:${email}` : appName;
    const uri = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(appName)}&algorithm=SHA1&digits=${digits}&period=${periodSeconds}`;
    void qrToString(uri, { type: 'svg', margin: 1 }).then(setQrSvg).catch(() => setQrSvg(undefined));
  }, [digits, email, periodSeconds, secret]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content
        size="md"
        className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)]"
      >
        <Modal.Header>
          <Modal.Title>2단계 인증 설정</Modal.Title>
          <Modal.Description>
            인증 앱에 아래 비밀키를 등록한 뒤 생성된
            {digits}
            자리 코드를 입력하세요.
          </Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <FormLayout
            onSubmit={() => void form.handleSubmit()}
            className="
              grid grid-rows-[minmax(0,1fr)_auto] overflow-hidden gap-4
            "
          >
            <Modal.Body className="scroll-y grid content-start gap-4 py-2 pr-1">
              {!secret && generate.isError && (
                <div className="grid gap-2">
                  <p role="alert" className="text-sm text-destructive">인증 앱 연결을 준비하지 못했습니다. 다시 시도해 주세요.</p>
                  <Button type="button" variant="outline" disabled={generate.isPending} onClick={() => generate.mutate()}>다시 시도</Button>
                </div>
              )}
              {!secret && !generate.isError && (
                <p role="status" className="text-sm text-muted-foreground">
                  인증 앱 연결을 준비하고 있습니다.
                </p>
              )}
              {secret && (
                <>
                  {qrSvg && (
                    <section className="grid gap-2">
                      <h3 className="text-sm font-medium">인증 앱으로 QR 코드 스캔</h3>
                      <div
                        className="
                          mx-auto rounded-lg border bg-white p-2
                          [&>svg]:size-44
                        "
                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                      />
                    </section>
                  )}
                  <section className="grid gap-2">
                    <h3 className="text-sm font-medium">비밀키</h3>
                    <InputGroup>
                      <InputGroupInput aria-label="2단계 인증 비밀키" value={secret} readOnly />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton size="icon-sm" aria-label="비밀키 복사" title="비밀키 복사" onClick={() => void copySecret()}>
                          <Copy className="size-4" />
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    <p className="text-xs text-muted-foreground">QR 코드를 스캔할 수 없는 경우 이 비밀키를 인증 앱에 직접 입력하세요.</p>
                  </section>
                  <form.AppField name="code">{(field) => <field.OtpInput label="인증 코드" maxLength={digits} required />}</form.AppField>
                </>
              )}
            </Modal.Body>
            {secret && (
              <Modal.Footer>
                <Button type="button" variant="outline" disabled={enable.isPending} onClick={() => close?.(false)}>취소</Button>
                <FormSubmit disabled={enable.isPending}>2FA 활성화</FormSubmit>
              </Modal.Footer>
            )}
          </FormLayout>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}
