import { z } from '@pkg/shared/common';
import * as PortOne from '@portone/browser-sdk/v2';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getAuthControllerMeV1QueryKey, useAuthControllerDisableTwoFactorV1, useAuthControllerVerifyPhoneNumberV1 } from '#/.generated/api/endpoints/auth/auth';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { ActionCard, PageSection } from '#/components/layout';
import { openModal } from '#/components/modal';

import { ProfileTwoFactorSetupModal } from './profile/-components/two-factor-setup-modal';

export const Route = createFileRoute('/_protected/_app/profile')({
  validateSearch: z.object({
    identityVerificationId: z.string().optional(),
    code: z.string().optional(),
    message: z.string().optional(),
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const { identityVerificationId, code, message } = Route.useSearch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutateAsync: verifyPhoneNumber, isPending: isVerifying } = useAuthControllerVerifyPhoneNumberV1();
  const disableTwoFactor = useAuthControllerDisableTwoFactorV1();
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const processedRef = useRef(false);
  const isBusy = isStarting || isVerifying;
  let verificationButtonLabel = user.phoneNumberVerified ? '전화번호 변경' : '본인인증 시작';
  if (isBusy) verificationButtonLabel = '인증 결과 확인 중...';

  const refreshUser = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
    await router.invalidate();
  }, [queryClient, router]);

  const toggleTwoFactor = async () => {
    if (!user.twoFactorEnabled) {
      const enabled = await openModal(ProfileTwoFactorSetupModal, { email: user.email });
      if (enabled) {
        queryClient.setQueryData(getAuthControllerMeV1QueryKey(), (current) => current ? { ...current, twoFactorEnabled: true } : current);
        await router.invalidate();
      }
      return;
    }
    const confirmed = await confirm({ title: '2단계 인증 해제', description: '현재 계정의 2단계 인증을 해제할까요?', confirmLabel: '해제', tone: 'danger' });
    if (!confirmed) return;
    await disableTwoFactor.mutateAsync();
    queryClient.setQueryData(getAuthControllerMeV1QueryKey(), (current) => current ? { ...current, twoFactorEnabled: false } : current);
    await router.invalidate();
  };

  useEffect(() => {
    if ((!identityVerificationId && !code) || processedRef.current) return;
    processedRef.current = true;
    async function processReturn() {
      try {
        if (code) {
          if (!code.toUpperCase().includes('CANCEL')) setError(message || code);
        }
        else if (identityVerificationId) {
          await verifyPhoneNumber({ data: { identityVerificationId } });
          await refreshUser();
        }
      }
      catch (verificationError) {
        setError(verificationError instanceof Error ? verificationError.message : '본인인증 결과를 확인하지 못했습니다.');
      }
    }
    void processReturn();
  }, [identityVerificationId, code, message, verifyPhoneNumber, refreshUser]);

  async function startVerification() {
    setError('');
    setIsStarting(true);
    try {
      const storeId = String(import.meta.env.VITE_PORTONE_STORE_ID ?? '');
      const channelKey = String(import.meta.env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY ?? '');
      if (!storeId || !channelKey) throw new Error('PortOne 스토어 ID와 본인인증 채널 키를 설정해 주세요.');
      const redirectUrl = new URL(window.location.href);
      for (const key of ['identityVerificationId', 'code', 'message']) redirectUrl.searchParams.delete(key);
      const result = await PortOne.requestIdentityVerification({
        storeId,
        channelKey,
        identityVerificationId: `idv_${crypto.randomUUID()}`,
        windowType: { pc: 'REDIRECTION', mobile: 'REDIRECTION' },
        redirectUrl: redirectUrl.toString(),
      });
      if (!result) return;
      if (result.code) {
        if (!result.code.toUpperCase().includes('CANCEL')) setError(result.message || result.code);
        return;
      }
      await verifyPhoneNumber({ data: { identityVerificationId: result.identityVerificationId } });
      await refreshUser();
    }
    catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : '본인인증을 완료하지 못했습니다.');
    }
    finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="
      size-full px-6 py-8
      md:px-8
    "
    >
      <PageSection icon="user" title="프로필" description="계정의 보안 상태를 확인하고 관리합니다.">
        <PageSection.Content className="
          mx-auto grid w-full max-w-3xl gap-4 pt-2 scroll-y
        "
        >
          <Card>
            <CardHeader>
              <CardTitle>본인인증</CardTitle>
              <CardDescription>휴대폰 본인인증으로 전화번호를 등록하거나 변경합니다.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p>{user.phoneNumber || '전화번호 미등록'}</p>
              <p role="status" className="text-sm text-muted-foreground">
                {user.phoneNumberVerified ? '인증 완료' : '본인인증 필요'}
              </p>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <Button className="w-fit" disabled={isBusy} onClick={() => void startVerification()}>
                {verificationButtonLabel}
              </Button>
            </CardContent>
          </Card>
          <ActionCard
            icon={user.twoFactorEnabled ? 'shield-check' : 'triangle-alert'}
            iconColor={user.twoFactorEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
            title="2단계 인증"
            description={user.twoFactorEnabled ? '2단계 인증이 활성화되어 있습니다.' : '계정 보안을 위해 2단계 인증을 설정하세요.'}
            descriptionTone={user.twoFactorEnabled ? 'default' : 'warning'}
            variant="ghost"
          >
            <ActionCard.Actions>
              <Button type="button" variant="outline" size="sm" disabled={disableTwoFactor.isPending} onClick={() => void toggleTwoFactor()}>
                {user.twoFactorEnabled ? '2FA 해제' : '2FA 설정'}
              </Button>
            </ActionCard.Actions>
          </ActionCard>
        </PageSection.Content>
      </PageSection>
    </div>
  );
}
