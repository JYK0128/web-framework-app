import { z } from '@pkg/shared/common';
import * as PortOne from '@portone/browser-sdk/v2';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { getAuthControllerMeV1QueryKey, useAuthControllerVerifyPhoneNumberV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button } from '#/.generated/shadcn/components/ui';

import { OnboardingLayout } from './-components/onboarding-layout';

export const Route = createFileRoute('/_protected/_global/onboarding/verify-phone')({
  validateSearch: z.object({
    callback: z.string().optional(),
    identityVerificationId: z.string().optional(),
    code: z.string().optional(),
    message: z.string().optional(),
  }),
  component: IdentityVerificationOnboardingPage,
});

function IdentityVerificationOnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { identityVerificationId, code, message } = Route.useSearch();
  const verifyPhoneNumber = useAuthControllerVerifyPhoneNumberV1({
    mutation: {
      onSuccess: async () => {
        queryClient.setQueryData(getAuthControllerMeV1QueryKey(), (current) => current ? { ...current, phoneNumberVerified: true } : current);
        await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
        await router.invalidate();
      },
    },
  });
  const processedRef = useRef(false);
  const [error, setError] = useState(() => code && !code.toUpperCase().includes('CANCEL') ? message || code : '');

  useEffect(() => {
    if ((!identityVerificationId && !code) || processedRef.current) return;
    processedRef.current = true;
    async function processReturn() {
      try {
        if (code) {
          if (!code.toUpperCase().includes('CANCEL')) setError(message || code);
          return;
        }
        if (!identityVerificationId) return;
        await verifyPhoneNumber.mutateAsync({ data: { identityVerificationId } });
      }
      catch {
        // API 오류는 전역 QueryCache/MutationCache에서 표시합니다.
      }
    }
    void processReturn();
  }, [identityVerificationId, code, message, queryClient, router, verifyPhoneNumber]);

  const startVerification = async () => {
    const storeId = String(import.meta.env.VITE_PORTONE_STORE_ID ?? '');
    const channelKey = String(import.meta.env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY ?? '');
    if (!storeId || !channelKey) {
      setError('PortOne 스토어 ID와 본인인증 채널 키를 설정해 주세요.');
      return;
    }
    setError('');
    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('identityVerificationId');
      currentUrl.searchParams.delete('code');
      currentUrl.searchParams.delete('message');
      const result = await PortOne.requestIdentityVerification({
        storeId,
        identityVerificationId: `idv_${crypto.randomUUID()}`,
        channelKey,
        windowType: { pc: 'REDIRECTION', mobile: 'REDIRECTION' },
        redirectUrl: currentUrl.toString(),
      });
      if (!result || result.code) {
        if (result?.code && !result.code.toUpperCase().includes('CANCEL')) setError(result.message || '본인인증에 실패했습니다.');
        return;
      }
      verifyPhoneNumber.mutate({ data: { identityVerificationId: result.identityVerificationId } });
    }
    catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : '본인인증을 완료하지 못했습니다.');
    }
  };

  return (
    <OnboardingLayout
      icon="user-round-check"
      title="본인인증"
      description="관리자 계정 사용을 위해 본인인증을 완료해 주세요."
      footer={(
        <Button
          className="w-full"
          onClick={() => void startVerification()}
          disabled={verifyPhoneNumber.isPending}
        >
          {verifyPhoneNumber.isPending ? '확인 중...' : '본인인증 시작'}
        </Button>
      )}
    >
      <p className="text-sm text-muted-foreground">인증을 완료하면 필수 보안 절차의 다음 단계로 이동합니다.</p>
      {verifyPhoneNumber.isPending && !error && (
        <p
          role="status"
          className="text-sm text-muted-foreground"
        >
          본인인증 결과를 확인하고 있습니다.
        </p>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </OnboardingLayout>
  );
}
