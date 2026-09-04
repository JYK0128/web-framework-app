import { z } from '@pkg/shared/common';
import * as PortOne from '@portone/browser-sdk/v2';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { CheckCircle2, Loader2, ShieldCheck, Smartphone } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { getAuthControllerUserProfileQueryKey } from '#/.generated/api/endpoints/auth/auth';
import { useOnboardingControllerVerifyIdentity } from '#/.generated/api/endpoints/onboarding/onboarding';
import { Button } from '#/.generated/shadcn/components/ui';
import { env } from '#/env';
import { useI18n } from '#/hooks';

import { OnboardingLayout } from './-components/onboarding-layout';

export const Route = createFileRoute('/_protected/onboarding/phone')({
  validateSearch: z.object({
    identityVerificationId: z.string().optional(),
    code: z.string().optional(),
    message: z.string().optional(),
  }),
  component: PhoneOnboardingPage,
});

function PhoneOnboardingPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const verifyIdentityMutation = useOnboardingControllerVerifyIdentity();
  const redirectedProcessedRef = useRef(false);

  // REDIRECTION 방식으로 돌아왔을 때 쿼리 스트링(identityVerificationId) 자동 검증
  useEffect(() => {
    const verificationId = searchParams.identityVerificationId;
    if (!verificationId || redirectedProcessedRef.current) return;
    redirectedProcessedRef.current = true;

    verifyIdentityMutation.mutateAsync({
      data: { identityVerificationId: verificationId },
    })
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: getAuthControllerUserProfileQueryKey() });
        await navigate({ to: '/dashboard', replace: true });
      })
      .catch((err) => {
        console.error('Identity verification error:', err);
      });
  }, [searchParams.identityVerificationId, verifyIdentityMutation, queryClient, navigate]);

  const isPortOneConfigured = Boolean(env.VITE_PORTONE_STORE_ID && env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY);

  const portOneFlowMutation = useMutation({
    mutationFn: async () => {
      if (!isPortOneConfigured) {
        throw new Error(t('onboarding.portoneEnvMissing'));
      }

      const identityVerificationId = `idv_${crypto.randomUUID()}`;

      const response = await PortOne.requestIdentityVerification({
        storeId: env.VITE_PORTONE_STORE_ID,
        identityVerificationId,
        channelKey: env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY,
        windowType: {
          pc: 'REDIRECTION',
          mobile: 'REDIRECTION',
        },
        redirectUrl: window.location.origin + window.location.pathname,
      });

      // 1. 유저가 취소한 경우 조용히 로딩 종료
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

      // 3. 정상 완료된 건에 대해서만 백엔드 교차 검증 호출 (팝업/iframe 프로미스 응답 시)
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

  return (
    <OnboardingLayout
      icon="phone"
      title={t('onboarding.phoneTitle')}
      description={t('onboarding.portoneSubtitle')}
      footer={(
        <Button
          type="button"
          size="lg"
          className="
            h-11 w-full gap-2 text-sm font-bold shadow-md transition-all
          "
          disabled={isPending}
          onClick={() => portOneFlowMutation.mutate()}
        >
          {isPending
            ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('onboarding.verifying')}
              </>
            )
            : (
              <>
                <ShieldCheck className="size-4" />
                {t('onboarding.portoneVerifyButton')}
              </>
            )}
        </Button>
      )}
    >
      {/* PortOne Verification Info Box */}
      <div className="
        grid gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4
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
          grid gap-1.5 border-t border-primary/10 pt-3 text-[11px]
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
    </OnboardingLayout>
  );
}
