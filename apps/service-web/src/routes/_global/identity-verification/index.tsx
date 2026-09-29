import * as PortOne from '@portone/browser-sdk/v2';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState } from 'react';

import { getAuthControllerMeV1QueryKey, useIdentityVerificationControllerVerifyV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { ScreenLayout } from '#/components/layout';

export const Route = createFileRoute('/_global/identity-verification/')({
  validateSearch: (search: Record<string, unknown>) => ({ callback: typeof search.callback === 'string' ? search.callback : undefined }),
  component: IdentityVerificationPage,
});

function IdentityVerificationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { callback } = Route.useSearch();
  const [errorMessage, setErrorMessage] = useState<string>();
  const verifyMutation = useIdentityVerificationControllerVerifyV1();
  const configured = Boolean(import.meta.env.VITE_PORTONE_STORE_ID && import.meta.env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY);
  const storeId = String(import.meta.env.VITE_PORTONE_STORE_ID ?? '');
  const channelKey = String(import.meta.env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY ?? '');

  const verifyIdentity = async () => {
    setErrorMessage(undefined);
    if (!configured) {
      setErrorMessage('PortOne 스토어 ID와 본인인증 채널 키를 설정해 주세요.');
      return;
    }

    try {
      const result = await PortOne.requestIdentityVerification({
        storeId,
        identityVerificationId: `idv_${crypto.randomUUID()}`,
        channelKey,
        windowType: { pc: 'IFRAME', mobile: 'IFRAME' },
        redirectUrl: window.location.href,
      });
      if (!result) return;
      if (result.code) {
        if (result.code.toUpperCase().includes('CANCEL')) return;
        throw new Error(result.message || result.code);
      }
      await verifyMutation.mutateAsync({ data: { identityVerificationId: result.identityVerificationId } });
      await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
      await router.invalidate();
      router.history.replace(resolveDestination(callback));
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '본인인증을 완료하지 못했습니다. 다시 시도해 주세요.');
    }
  };

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
              <p
                role="alert"
                className="text-sm text-destructive"
              >
                {errorMessage}
              </p>
            )}
            <Button className="w-full" onClick={() => void verifyIdentity()} disabled={!configured || verifyMutation.isPending}>
              {verifyMutation.isPending ? '인증 결과 확인 중...' : '본인인증 시작'}
            </Button>
          </CardContent>
        </Card>
      </ScreenLayout.Content>
    </ScreenLayout>
  );
}

function resolveDestination(callback?: string): string {
  if (!callback) return '/qna';
  try {
    const url = new URL(callback, window.location.origin);
    if (url.origin !== window.location.origin) return '/qna';
    return `${url.pathname}${url.search}${url.hash}`;
  }
  catch {
    return '/qna';
  }
}
