import { useI18n } from '@pkg/shared/web';
import * as PortOne from '@portone/browser-sdk/v2';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CheckCircle2, Loader2, LogOut, Phone, ShieldCheck, Smartphone } from 'lucide-react';

import { getAuthControllerUserProfileQueryKey, useAuthControllerLogout } from '#/.generated/api/endpoints/auth/auth';
import { useOnboardingControllerVerifyIdentity } from '#/.generated/api/endpoints/onboarding/onboarding';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { env } from '#/env';

export const Route = createFileRoute('/_protected/onboarding/phone')({
  component: PhoneOnboardingPage,
});

function PhoneOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const verifyIdentityMutation = useOnboardingControllerVerifyIdentity();
  const logoutMutation = useAuthControllerLogout();

  const isPortOneConfigured = Boolean(env.VITE_PORTONE_STORE_ID && env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY);

  const portOneFlowMutation = useMutation({
    mutationFn: async () => {
      if (!isPortOneConfigured) {
        throw new Error(t('onboarding.portoneEnvMissing'));
      }

      const identityVerificationId = `idv_${crypto.randomUUID()}`;

      const response = await PortOne.requestIdentityVerification({
        storeId: env.VITE_PORTONE_STORE_ID!,
        identityVerificationId,
        channelKey: env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY!,
        windowType: {
          pc: 'POPUP',
          mobile: 'POPUP',
        },
      });

      // 1. 유저가 팝업 창을 닫았거나 취소한 경우 조용히 로딩 종료
      if (!response) {
        return;
      }

      // 2. 에러 코드가 있는 경우 처리
      if (response.code) {
        if (response.code.toUpperCase().includes('CANCEL')) {
          return;
        }
        throw new Error(response.message || response.code);
      }

      // 3. 정상 완료된 건에 대해서만 백엔드 교차 검증 호출
      await verifyIdentityMutation.mutateAsync({
        data: {
          identityVerificationId: response.identityVerificationId,
        },
      });

      await queryClient.invalidateQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
      await navigate({ to: '/dashboard', replace: true });
    },
  });

  const isPending = portOneFlowMutation.isPending || verifyIdentityMutation.isPending;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    }
    catch {
      // Continue with local cleanup even if server cleanup fails.
    }
    finally {
      queryClient.removeQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
      await navigate({ to: '/login', replace: true });
      queryClient.clear();
    }
  };

  return (
    <div className="
      flex min-h-dvh flex-col items-center justify-center bg-linear-to-b
      from-background via-muted/30 to-background p-4
      sm:p-6
    "
    >
      <div className="grid w-full max-w-md gap-6">
        <div className="grid justify-items-center gap-2 text-center">
          <div className="
            flex items-center gap-2 rounded-full border border-primary/20
            bg-primary/10 px-3 py-1 text-xs font-semibold text-primary
          "
          >
            <span className="size-2 rounded-full bg-primary" />
            {t('onboarding.stepIndicator', { current: '2', total: '3' })}
            <span className="text-muted-foreground">·</span>
            <span>{t('onboarding.stepPhone')}</span>
          </div>
          <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
            <div className="
              h-full w-2/3 rounded-full bg-primary transition-all duration-500
            "
            />
          </div>
        </div>

        <Card className="
          border border-border/80 bg-card/95 shadow-xl backdrop-blur-xl
        "
        >
          <CardHeader className="pb-4 text-center">
            <div className="
              mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl
              border border-primary/20 bg-linear-to-br from-primary/20
              to-primary/5 text-primary shadow-xs
            "
            >
              <Phone className="size-7" />
            </div>
            <CardTitle className="
              text-xl font-extrabold tracking-tight
              sm:text-2xl
            "
            >
              {t('onboarding.phoneTitle')}
            </CardTitle>
            <CardDescription className="
              mx-auto mt-1.5 max-w-xs text-xs/relaxed text-muted-foreground
              sm:text-sm
            "
            >
              {t('onboarding.portoneSubtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5 px-6 py-4">
            {/* PortOne Verification Info Box */}
            <div className="
              grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4
            "
            >
              <div className="flex items-center gap-3">
                <div className="
                  flex size-9 shrink-0 items-center justify-center rounded-lg
                  bg-primary/10 text-primary
                "
                >
                  <Smartphone className="size-5" />
                </div>
                <div className="grid gap-0.5">
                  <span className="text-xs font-bold text-foreground">
                    통신사 PASS 및 SMS 본인확인
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    SKT, KT, LG U+, 알뜰폰 통신사를 통한 실명 확인
                  </span>
                </div>
              </div>

              <div className="
                grid gap-1.5 border-t border-primary/10 pt-2.5 text-[11px]
                text-muted-foreground
              "
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                  <span>1인 1계정 원칙에 따라 안전하게 실명을 확인합니다.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                  <span>입력하신 개인정보는 암호화되어 안전하게 전송됩니다.</span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <Button
              type="button"
              size="lg"
              className="
                h-12 w-full gap-2.5 text-sm font-bold shadow-md transition-all
              "
              disabled={isPending}
              onClick={() => portOneFlowMutation.mutate()}
            >
              {isPending
                ? <Loader2 className="size-4 animate-spin" />
                : <ShieldCheck className="size-4.5" />}
              {isPending
                ? t('onboarding.verifying')
                : t('onboarding.portoneVerifyButton')}
            </Button>
          </CardContent>

          <CardFooter className="
            flex justify-center border-t border-border/60 py-3.5
          "
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground"
              disabled={logoutMutation.isPending}
              onClick={() => void handleLogout()}
            >
              {logoutMutation.isPending
                ? (
                  <Loader2 className="size-3.5 animate-spin" />
                )
                : (
                  <LogOut className="size-3.5" />
                )}
              {t('onboarding.logoutPrompt')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
