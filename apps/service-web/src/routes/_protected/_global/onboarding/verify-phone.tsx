import { z } from '@pkg/shared/common';
import * as PortOne from '@portone/browser-sdk/v2';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  component: IdentityVerificationPage,
});

function IdentityVerificationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { identityVerificationId, code, message } = Route.useSearch();
  const [errorMessage, setErrorMessage] = useState<string>(() => (
    code && !code.toUpperCase().includes('CANCEL') ? message || code : ''
  ));
  const redirectedProcessedRef = useRef(false);
  const verifyMutation = useAuthControllerVerifyPhoneNumberV1({
    mutation: {
      onSuccess: async () => {
        queryClient.setQueryData(getAuthControllerMeV1QueryKey(), (current) => current ? { ...current, phoneNumberVerified: true } : current);
        await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
        await router.invalidate();
      },
    },
  });
  const configured = Boolean(import.meta.env.VITE_PORTONE_STORE_ID && import.meta.env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY);
  const storeId = String(import.meta.env.VITE_PORTONE_STORE_ID ?? '');
  const channelKey = String(import.meta.env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY ?? '');

  useEffect(() => {
    if ((!identityVerificationId && !code) || redirectedProcessedRef.current) return;
    redirectedProcessedRef.current = true;
    async function processReturn() {
      try {
        if (code) {
          if (!code.toUpperCase().includes('CANCEL')) setErrorMessage(message || code);
          return;
        }
        if (!identityVerificationId) return;
        await verifyMutation.mutateAsync({ data: { identityVerificationId } });
      }
      catch {
        // API 오류는 전역 QueryCache/MutationCache에서 표시합니다.
      }
    }
    void processReturn();
  }, [identityVerificationId, code, message, queryClient, router, verifyMutation]);

  const startVerification = useMutation({
    onMutate: () => setErrorMessage(''),
    mutationFn: async () => {
      if (!configured) throw new Error('지금은 본인인증을 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.');

      const redirectUrl = new URL(window.location.href);
      for (const key of ['identityVerificationId', 'code', 'message']) redirectUrl.searchParams.delete(key);
      const result = await PortOne.requestIdentityVerification({
        storeId,
        identityVerificationId: `idv_${crypto.randomUUID()}`,
        channelKey,
        windowType: { pc: 'REDIRECTION', mobile: 'REDIRECTION' },
        redirectUrl: redirectUrl.toString(),
      });

      if (!result) return;
      if (result.code) {
        if (result.code.toUpperCase().includes('CANCEL')) return;
        throw new Error(result.message || result.code);
      }

      return result;
    },
    onError: (error) => setErrorMessage(error.message),
    onSuccess: (result) => {
      if (!result) return;
      verifyMutation.mutate({ data: { identityVerificationId: result.identityVerificationId } });
    },
  });

  return (
    <OnboardingLayout
      icon="user-round-check"
      title="본인인증"
      description="안전한 이용을 위해 본인인증을 진행해 주세요."
      footer={(
        <Button className="w-full" onClick={() => startVerification.mutate()} disabled={!configured || startVerification.isPending || verifyMutation.isPending}>
          {startVerification.isPending || verifyMutation.isPending ? '본인인증 중...' : '본인인증 시작'}
        </Button>
      )}
    >
      <p className="text-sm text-muted-foreground">본인인증을 마치면 다음 단계로 안내해 드릴게요.</p>
      {!configured && <p role="alert" className="text-sm text-destructive">지금은 본인인증을 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.</p>}
      {(startVerification.isPending || verifyMutation.isPending) && !errorMessage && (
        <p role="status" className="text-sm text-muted-foreground">본인인증 결과를 확인하고 있습니다.</p>
      )}
      {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
    </OnboardingLayout>
  );
}
