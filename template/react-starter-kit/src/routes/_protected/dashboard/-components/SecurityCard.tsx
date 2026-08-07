import { KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge, Button, Card, CardContent } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { useAuth } from '#/core/auth/useAuth';

import { TwoFactorSetupModal } from './modals/TwoFactorSetupModal';

export function SecurityCard() {
  const { user, generate2FA, turnOff2FA } = useAuth();
  const isTwoFactorEnabled = Boolean(user?.twoFactorEnabled);

  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const handleOpen2FASetup = async () => {
    setIsGeneratingQr(true);
    try {
      const res = await generate2FA();
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
      title: '2단계 인증 해제',
      description: '정말로 2단계 인증을 해제하시겠습니까? 계정 보안 레벨이 낮아집니다.',
      tone: 'danger',
      confirmLabel: '해제하기',
      cancelLabel: '취소',
    });

    if (!isConfirmed) return;

    await turnOff2FA();
    toast.info('2단계 인증이 해제되었습니다.');
  };

  return (
    <>
      <Card className="p-6">
        <CardContent className="grid gap-6 p-0">
          <div className="flex items-start justify-between gap-4">
            <div className="grid flex-1 gap-1">
              <h3 className="text-base font-bold">2단계 인증 (2FA - OTP)</h3>
              <p className="text-xs text-muted-foreground">
                Google Authenticator 등 OTP 앱을 통해 로그인 시 추가 6자리 번호를 인증합니다.
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
                    <span>2FA 활성</span>
                  </>
                )
                : (
                  <>
                    <ShieldAlert className="size-4 shrink-0 text-amber-500" />
                    <span>2FA 비활성</span>
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
                    현재 계정에 2단계 인증이 적용되어 있습니다. 해제하려면 아래 버튼을 누르세요.
                  </p>
                  <Button variant="destructive" size="sm" className="shrink-0" onClick={() => void handleTurnOff2FA()}>
                    2FA 설정 해제
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
                    OTP 등록을 진행하여 무단 접근으로부터 계정을 안전하게 보호하세요.
                  </p>
                  <Button size="sm" className="shrink-0" onClick={() => void handleOpen2FASetup()} disabled={isGeneratingQr}>
                    <KeyRound className="size-4" />
                    <span>{isGeneratingQr ? 'QR 코드 생성 중...' : '2FA 설정 시작'}</span>
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
      />
    </>
  );
}
