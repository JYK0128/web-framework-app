import { useI18n } from '@pkg/shared/web';
import { Check, Copy } from 'lucide-react';
import { toString as qrToString } from 'qrcode';
import { useEffect, useState } from 'react';

import { useAuthControllerTurnOn2FA } from '#/.generated/api/endpoints/auth/auth';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';

type TwoFactorSetupModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  secret?: string
  email?: string
  onEnabled: () => void
};

export function TwoFactorSetupModal({ open, onOpenChange, secret, email, onEnabled }: TwoFactorSetupModalProps) {
  const turnOn2FAMutation = useAuthControllerTurnOn2FA();
  const { t } = useI18n();
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);

  // Generate SVG QR Code directly from secret & user email on the client
  useEffect(() => {
    let ignore = false;

    if (!secret || !open) {
      return;
    }

    const appName = 'StarterKit';
    const label = email ? `${appName}:${email}` : appName;
    const otpAuthUri = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(appName)}&algorithm=SHA1&digits=6&period=30`;

    void qrToString(otpAuthUri, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    }).then((svg) => {
      if (!ignore) {
        setQrSvg(svg);
      }
    }).catch(() => {
      if (!ignore) {
        setQrSvg(null);
      }
    });

    return () => {
      ignore = true;
    };
  }, [secret, email, open]);

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

      await turnOn2FAMutation.mutateAsync({ data: { code } });
      onEnabled();
      twoFaForm.reset();
      onOpenChange(false);
    },
  });

  const handleCopySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    catch {
      // ignore clipboard write errors
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setTwoFaError(null);
          setCopied(false);
          setQrSvg(null);
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
          <FormLayout
            onSubmit={() => void twoFaForm.handleSubmit()}
            className="grid gap-4"
          >
            <p className="text-xs text-muted-foreground">
              {t('profile.twoFactorSetupDescription')}
            </p>

            {qrSvg && (
              <div className="flex justify-center py-2">
                <div
                  className="
                    size-44 rounded-xl border bg-white p-2 shadow-inner
                    dark:border-zinc-700
                    flex items-center justify-center
                    [&>svg]:size-full
                  "
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              </div>
            )}

            {secret && (
              <div className="
                rounded-lg border bg-muted/40 p-3 space-y-1.5 text-xs
              "
              >
                <div className="
                  flex items-center justify-between text-muted-foreground
                "
                >
                  <span className="font-medium">{t('profile.manualEntryKey')}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs gap-1 cursor-pointer"
                    onClick={() => void handleCopySecret()}
                  >
                    {copied
                      ? (
                        <>
                          <Check className="
                            size-3 text-emerald-600
                            dark:text-emerald-400
                          "
                          />
                          <span className="
                            text-emerald-600
                            dark:text-emerald-400
                          "
                          >
                            {t('profile.copied')}
                          </span>
                        </>
                      )
                      : (
                        <>
                          <Copy className="size-3" />
                          <span>{t('profile.copy')}</span>
                        </>
                      )}
                  </Button>
                </div>
                <div className="
                  font-mono text-center tracking-wider font-semibold
                  text-foreground select-all bg-background/80 py-1.5 px-2
                  rounded-sm border border-border/60
                "
                >
                  {secret}
                </div>
              </div>
            )}

            <twoFaForm.AppField name="otpCode">
              {(field) => (
                <div className="grid justify-items-center gap-2 py-2">
                  <field.OtpInput label={t('profile.otpLabel')} maxLength={6} />
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

            <DialogFooter>
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
            </DialogFooter>
          </FormLayout>
        </twoFaForm.AppForm>
      </DialogContent>
    </Dialog>
  );
}
