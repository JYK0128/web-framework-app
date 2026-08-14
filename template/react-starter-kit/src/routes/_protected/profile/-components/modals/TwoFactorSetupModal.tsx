import { useI18n } from '@pkg/shared/web';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAuthControllerTurnOn2FA } from '#/.generated/api/endpoints/auth/auth';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, InputOTP, InputOTPGroup, InputOTPSlot } from '#/.generated/shadcn/components/ui';
import { useAppForm } from '#/components/form';

type TwoFactorSetupModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  qrCodeUrl: string | null
  onEnabled: () => void
};

export function TwoFactorSetupModal({ open, onOpenChange, qrCodeUrl, onEnabled }: TwoFactorSetupModalProps) {
  const { mutateAsync: turnOn2FA } = useAuthControllerTurnOn2FA();
  const { t } = useI18n();
  const [twoFaError, setTwoFaError] = useState<string | null>(null);

  const twoFaForm = useAppForm({
    defaultValues: {
      otpCode: '',
    },
    onSubmit: async ({ value }) => {
      setTwoFaError(null);

      const code = value.otpCode.trim();
      if (!code || code.length < 6) {
        setTwoFaError(t('profile.otpRequired'));
        return;
      }

      await turnOn2FA({ data: { code } });
      onEnabled();
      twoFaForm.reset();
      onOpenChange(false);
      toast.success(t('profile.twoFactorEnabledToast'));
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
            {t('profile.twoFactorSetupTitle')}
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
              {t('profile.twoFactorSetupDescription')}
            </p>

            {qrCodeUrl && (
              <div className="flex justify-center py-2">
                <img
                  src={qrCodeUrl}
                  alt={t('profile.qrCodeAlt')}
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
                    {t('profile.otpLabel')}
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
                {t('dialog.cancel')}
              </Button>
              <Button type="submit">
                {t('profile.activateTwoFactor')}
              </Button>
            </div>
          </form>
        </twoFaForm.AppForm>
      </DialogContent>
    </Dialog>
  );
}
