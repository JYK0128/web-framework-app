import { useI18n } from '@pkg/shared/web';
import { KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { useAuthControllerGenerate2FA, useAuthControllerTurnOff2FA } from '#/.generated/api/endpoints/auth/auth';
import type { AuthPrincipalResponse } from '#/.generated/api/model';
import { Badge, Button, Card, CardContent } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';

import { TwoFactorSetupModal } from './modals/TwoFactorSetupModal';

type SecurityCardProps = {
  user: AuthPrincipalResponse
  onTwoFactorChanged: (enabled: boolean) => void
};

export function SecurityCard({ user, onTwoFactorChanged }: SecurityCardProps) {
  const generate2FAMutation = useAuthControllerGenerate2FA();
  const turnOff2FAMutation = useAuthControllerTurnOff2FA();
  const { t } = useI18n();
  const isTwoFactorEnabled = Boolean(user.twoFactorEnabled);

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const handleOpen2FASetup = async () => {
    setIsGeneratingQr(true);
    try {
      const res = await generate2FAMutation.mutateAsync();
      if (res?.url) {
        setQrCodeUrl(res.url);
        setShow2FAModal(true);
      }
    }
    finally {
      setIsGeneratingQr(false);
    }
  };

  const handleTurnOff2FA = async () => {
    const isConfirmed = await confirm({
      title: t('profile.disableTwoFactorTitle'),
      description: t('profile.disableTwoFactorDescription'),
      tone: 'danger',
      confirmLabel: t('profile.disable'),
      cancelLabel: t('dialog.cancel'),
    });

    if (!isConfirmed) return;

    await turnOff2FAMutation.mutateAsync();
    onTwoFactorChanged(false);
  };

  return (
    <>
      <Card className="p-6">
        <CardContent className="grid gap-6 p-0">
          <div className="flex items-start justify-between gap-4">
            <div className="grid flex-1 gap-1">
              <h3 className="text-base font-bold">{t('profile.twoFactorTitle')}</h3>
              <p className="text-xs text-muted-foreground">
                {t('profile.twoFactorDescription')}
              </p>
            </div>

            <Badge
              variant="secondary"
              className="flex items-center gap-1 shrink-0"
            >
              {isTwoFactorEnabled
                ? (
                  <>
                    <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
                    <span>{t('profile.twoFactorActive')}</span>
                  </>
                )
                : (
                  <>
                    <ShieldAlert className="size-4 shrink-0 text-amber-500" />
                    <span>{t('profile.twoFactorInactive')}</span>
                  </>
                )}
            </Badge>
          </div>

          <div className="border-t pt-6">
            {isTwoFactorEnabled
              ? (
                <div className="
                  flex flex-col gap-4
                  sm:flex-row sm:items-center sm:justify-between
                "
                >
                  <p className="flex-1 text-xs text-muted-foreground">
                    {t('profile.twoFactorEnabledDescription')}
                  </p>
                  <Button variant="destructive" size="sm" className="shrink-0" onClick={() => void handleTurnOff2FA()}>
                    {t('profile.disableTwoFactor')}
                  </Button>
                </div>
              )
              : (
                <div className="
                  flex flex-col gap-4
                  sm:flex-row sm:items-center sm:justify-between
                "
                >
                  <p className="flex-1 text-xs text-muted-foreground">
                    {t('profile.twoFactorSetupDescription')}
                  </p>
                  <Button size="sm" className="shrink-0" onClick={() => void handleOpen2FASetup()} disabled={isGeneratingQr}>
                    <KeyRound className="size-4" />
                    <span>{isGeneratingQr ? t('profile.generatingQr') : t('profile.startTwoFactorSetup')}</span>
                  </Button>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      <TwoFactorSetupModal
        open={show2FAModal}
        onOpenChange={setShow2FAModal}
        qrCodeUrl={qrCodeUrl}
        onEnabled={() => onTwoFactorChanged(true)}
      />
    </>
  );
}
