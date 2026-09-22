import { z } from '@pkg/shared/common';
import { toString as qrToString } from 'qrcode';
import { useEffect, useState } from 'react';

import { useAuthControllerChangePasswordV1, useAuthControllerEnableTwoFactorV1, useAuthControllerGenerateTwoFactorV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button } from '#/.generated/shadcn/components/ui';
import { FormLayout, FormSubmit, useAppForm } from '#/components/form';
import { Modal, type ModalComponentProps } from '#/components/modal';

export function ChangePasswordModal({ open, onOpenChange, close }: ModalComponentProps<boolean>) {
  const mutation = useAuthControllerChangePasswordV1();
  const form = useAppForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validators: {
      onSubmit: z.object({
        currentPassword: z.string().min(1, '현재 비밀번호를 입력해 주세요.'),
        newPassword: z.string().min(8, '새 비밀번호는 8자 이상이어야 합니다.'),
        confirmPassword: z.string().min(8, '새 비밀번호를 다시 입력해 주세요.'),
      }),
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({ data: value });
      close?.(true);
    },
  });

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="md">
        <Modal.Header>
          <Modal.Title>비밀번호 변경</Modal.Title>
          <Modal.Description>현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <FormLayout
            onSubmit={() => void form.handleSubmit()}
            className="grid gap-4"
          >
            <form.AppField name="currentPassword">{(field) => <field.Input type="password" label="현재 비밀번호" autoComplete="current-password" required />}</form.AppField>
            <form.AppField name="newPassword">{(field) => <field.Input type="password" label="새 비밀번호" autoComplete="new-password" required />}</form.AppField>
            <form.AppField name="confirmPassword">{(field) => <field.Input type="password" label="새 비밀번호 확인" autoComplete="new-password" required />}</form.AppField>
            <Modal.Footer>
              <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => close?.(false)}>취소</Button>
              <FormSubmit disabled={mutation.isPending}>변경</FormSubmit>
            </Modal.Footer>
          </FormLayout>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}

export function TwoFactorSetupModal({ open, onOpenChange, close, email }: ModalComponentProps<boolean> & { email?: string }) {
  const generate = useAuthControllerGenerateTwoFactorV1();
  const enable = useAuthControllerEnableTwoFactorV1();
  const form = useAppForm({
    defaultValues: { code: '' },
    validators: { onSubmit: z.object({ code: z.string().length(6, '인증 코드는 6자리여야 합니다.') }) },
    onSubmit: async ({ value }) => {
      await enable.mutateAsync({ data: value });
      close?.(true);
    },
  });
  const secret = generate.data?.data.secret;
  const [qrSvg, setQrSvg] = useState<string>();

  useEffect(() => {
    if (!secret) return;
    const appName = 'Admin';
    const label = email ? `${appName}:${email}` : appName;
    const uri = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(appName)}&algorithm=SHA1&digits=6&period=30`;
    void qrToString(uri, { type: 'svg', margin: 1 }).then(setQrSvg).catch(() => setQrSvg(undefined));
  }, [email, secret]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <Modal.Content size="md">
        <Modal.Header>
          <Modal.Title>2단계 인증 설정</Modal.Title>
          <Modal.Description>인증 앱에 아래 비밀키를 등록한 뒤 생성된 6자리 코드를 입력하세요.</Modal.Description>
        </Modal.Header>
        <form.AppForm>
          <FormLayout
            onSubmit={() => void form.handleSubmit()}
            className="grid gap-4"
          >
            {!secret
              ? <Button type="button" disabled={generate.isPending} onClick={() => generate.mutate()}>설정용 비밀키 생성</Button>
              : (
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
                  <div className="
                    rounded-md border bg-muted/40 p-3 font-mono text-sm
                    break-all
                  "
                  >
                    {secret}
                  </div>
                  <form.AppField name="code">{(field) => <field.Input inputMode="numeric" label="인증 코드" placeholder="000000" maxLength={6} required />}</form.AppField>
                  <Modal.Footer>
                    <Button type="button" variant="outline" disabled={enable.isPending} onClick={() => close?.(false)}>취소</Button>
                    <FormSubmit disabled={enable.isPending}>2FA 활성화</FormSubmit>
                  </Modal.Footer>
                </>
              )}
          </FormLayout>
        </form.AppForm>
      </Modal.Content>
    </Modal>
  );
}

