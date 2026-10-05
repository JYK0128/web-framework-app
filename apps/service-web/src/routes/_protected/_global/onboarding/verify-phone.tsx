import { z } from '@pkg/shared/common';
import * as PortOne from '@portone/browser-sdk/v2';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { getAuthControllerMeV1QueryKey, useAuthControllerVerifyPhoneNumberV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';

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
  const verifyMutation = useAuthControllerVerifyPhoneNumberV1();
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
        queryClient.setQueryData(getAuthControllerMeV1QueryKey(), (current) => current ? { ...current, phoneNumberVerified: true } : current);
        await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
        await router.invalidate();
      }
      catch (verificationError) {
        setErrorMessage(verificationError instanceof Error ? verificationError.message : '본인인증 결과를 확인하지 못했습니다.');
      }
    }
    void processReturn();
  }, [identityVerificationId, code, message, queryClient, router, verifyMutation]);

  const startVerification = useMutation({
    mutationFn: async () => {
      if (!configured) throw new Error('PortOne 스토어 ID와 본인인증 채널 키를 설정해 주세요.');

      setErrorMessage('');
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

      await verifyMutation.mutateAsync({ data: { identityVerificationId: result.identityVerificationId } });
      queryClient.setQueryData(getAuthControllerMeV1QueryKey(), (current) => current ? { ...current, phoneNumberVerified: true } : current);
      await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
      await router.invalidate();
    },
    onError: (error) => setErrorMessage(error instanceof Error ? error.message : '본인인증을 완료하지 못했습니다. 다시 시도해 주세요.'),
  });

  return (
    <ScreenLayout>
      <ScreenLayout.Content>
        <Card className="w-full max-w-md shadow-xl border border-border/40">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">본인인증</CardTitle>
            <CardDescription>서비스를 이용하려면 PASS 또는 통신사 인증으로 본인 확인을 완료해 주세요.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {!configured && <p role="alert" className="text-sm text-destructive">PortOne 스토어 ID와 본인인증 채널 키를 설정해 주세요.</p>}
            {errorMessage && (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage}
              </p>
            )}
            <Button className="w-full" onClick={() => startVerification.mutate()} disabled={!configured || startVerification.isPending || verifyMutation.isPending}>
              {startVerification.isPending || verifyMutation.isPending ? '인증 결과 확인 중...' : '본인인증 시작'}
            </Button>
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}
