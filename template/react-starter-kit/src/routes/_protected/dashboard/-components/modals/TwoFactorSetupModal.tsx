import { useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, InputOTP, InputOTPGroup, InputOTPSlot } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';
import { useAuth } from '#/core/auth/useAuth';

type TwoFactorSetupModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  qrCodeUrl: string | null
};

export function TwoFactorSetupModal({ open, onOpenChange, qrCodeUrl }: TwoFactorSetupModalProps) {
  const { turnOn2FA } = useAuth();
  const [twoFaError, setTwoFaError] = useState<string | null>(null);

  const twoFaForm = useAppForm({
    defaultValues: {
      otpCode: '',
    },
    onSubmit: async ({ value }) => {
      setTwoFaError(null);

      const code = value.otpCode.trim();
      if (!code || code.length < 6) {
        setTwoFaError('6자리 OTP 인증번호를 입력해주세요.');
        return;
      }

      await turnOn2FA({ code });
      twoFaForm.reset();
      onOpenChange(false);
      toast.success('2단계 인증(2FA)이 설정되었습니다.');
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setTwoFaError(null);
          twoFaForm.reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            2단계 인증(2FA) 설정
          </DialogTitle>
        </DialogHeader>

        <twoFaForm.AppForm>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void twoFaForm.handleSubmit();
            }}
            className="grid gap-4"
          >
            <p className="text-xs text-muted-foreground">
              인증 앱(Google Authenticator, Authy 등)으로 아래 QR 코드를 스캔한 후 생성된 6자리 번호를 입력하세요.
            </p>

            {qrCodeUrl && (
              <div className="flex justify-center py-2">
                <img
                  src={qrCodeUrl}
                  alt="2FA QR Code"
                  className="
                    size-44 rounded-xl border bg-white p-2 shadow-inner
                    dark:border-zinc-700
                  "
                />
              </div>
            )}

            <twoFaForm.AppField name="otpCode">
              {(field) => (
                <div className="grid justify-items-center gap-2 py-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    OTP 인증번호 (6자리)
                  </label>
                  <InputOTP
                    maxLength={6}
                    value={field.state.value}
                    onChange={(val) => field.handleChange(val)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              )}
            </twoFaForm.AppField>

            {twoFaError && (
              <div className="
                rounded-xl border border-destructive/30 bg-destructive/10 p-3
                text-xs font-semibold text-destructive
              "
              >
                {twoFaError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button type="submit">
                2FA 활성화
              </Button>
            </div>
          </form>
        </twoFaForm.AppForm>
      </DialogContent>
    </Dialog>
  );
}
