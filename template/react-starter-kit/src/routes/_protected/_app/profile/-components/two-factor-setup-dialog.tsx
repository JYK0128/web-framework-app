import { Check, Copy, Loader2 } from 'lucide-react';
import { toString as qrToString } from 'qrcode';
import { useEffect, useState } from 'react';

import { useAuthControllerGenerate2FA, useAuthControllerTurnOn2FA } from '#/.generated/api/endpoints/auth/auth';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '#/.generated/shadcn/components/ui';
import { ActionCard, type DialogComponentProps } from '#/components/app';
import { FormLayout, useAppForm } from '#/components/form';
import { useI18n } from '#/hooks';

type TwoFactorSetupDialogProps = DialogComponentProps<boolean>;

export function TwoFactorSetupDialog({
  open,
  onOpenChange,
  close,
}: TwoFactorSetupDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>{t('profile.twoFa.modalTitle')}</DialogTitle>
        </DialogHeader>
        <TwoFactorSetupForm
          onSuccess={() => close?.(true)}
        />
      </DialogContent>
    </Dialog>
  );
}

function TwoFactorSetupForm({
  email,
  onSuccess,
}: {
  email?: string
  onSuccess: () => void
}) {
  const turnOn2FAMutation = useAuthControllerTurnOn2FA();
  const generate2FAMutation = useAuthControllerGenerate2FA();
  const { t } = useI18n();

  const [secret, setSecret] = useState<string | null>(null);
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [isLoadingSecret, setIsLoadingSecret] = useState(true);

  // Generate 2FA Secret on mount
  useEffect(() => {
    let ignore = false;

    generate2FAMutation.mutateAsync()
      .then((data) => {
        if (!ignore && data?.secret) {
          setSecret(data.secret);
        }
      })
      .catch(() => {
        if (!ignore) {
          setTwoFaError(t('profile.twoFa.generateError'));
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingSecret(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [generate2FAMutation, t]);

  // Generate SVG QR Code directly from secret & user email
  useEffect(() => {
    let ignore = false;

    if (!secret) return;

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
  }, [secret, email]);

  const twoFaForm = useAppForm({
    defaultValues: {
      code: '',
    },
    onSubmit: async ({ value }) => {
      setTwoFaError(null);

      if (!value.code || value.code.trim().length !== 6) {
        setTwoFaError(t('profile.twoFa.invalidCodeLength'));
        return;
      }

      try {
        await turnOn2FAMutation.mutateAsync({
          data: {
            code: value.code,
          },
        });
        onSuccess();
      }
      catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('profile.twoFa.setupFailed');
        setTwoFaError(message);
      }
    },
  });

  const handleCopySecret = () => {
    if (secret) {
      void navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoadingSecret) {
    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">{t('profile.twoFa.generatingSecret')}</p>
      </div>
    );
  }

  return (
    <twoFaForm.AppForm>
      <FormLayout
        onSubmit={() => void twoFaForm.handleSubmit()}
        className="grid gap-4"
      >
        <div className="flex flex-col items-center gap-4">
          {qrSvg
            ? (
              <div
                className="
                  rounded-lg border bg-white shadow-xs
                  [&>svg]:size-40 [&>svg]:block
                "
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            )
            : (
              <div className="
                flex size-44 items-center justify-center rounded-lg border
                bg-muted/40 text-xs text-muted-foreground text-center
              "
              >
                {t('profile.twoFa.qrLoading')}
              </div>
            )}

          {secret && (
            <ActionCard
              variant="outline"
              icon="key-round"
              title={t('profile.twoFa.secretKeyLabel')}
              description={secret}
            >
              <ActionCard.Actions>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCopySecret}
                  title={t('profile.twoFa.copySecret')}
                >
                  {copied
                    ? (
                      <Check className="size-3.5 text-emerald-500" />
                    )
                    : (
                      <Copy className="size-3.5" />
                    )}
                </Button>
              </ActionCard.Actions>
            </ActionCard>
          )}
        </div>

        <twoFaForm.AppField name="code">
          {(field) => (
            <field.Input
              label={t('profile.twoFa.codeLabel')}
              placeholder="000000"
              maxLength={6}
              className="text-center font-mono text-lg tracking-widest"
              autoComplete="one-time-code"
              autoFocus
            />
          )}
        </twoFaForm.AppField>

        {twoFaError && (
          <p className="text-xs text-destructive">{twoFaError}</p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={turnOn2FAMutation.isPending || !secret}
          >
            {turnOn2FAMutation.isPending ? t('common.processing') : t('profile.twoFa.enableButton')}
          </Button>
        </DialogFooter>
      </FormLayout>
    </twoFaForm.AppForm>
  );
}
