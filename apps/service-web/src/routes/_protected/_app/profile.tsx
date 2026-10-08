import { z } from '@pkg/shared/common';
import { SERVICE_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import * as PortOne from '@portone/browser-sdk/v2';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { FileText, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { getAuthControllerMeV1QueryKey, useAuthControllerDisableTwoFactorV1, useAuthControllerUnregisterV1, useAuthControllerVerifyPhoneNumberV1 } from '#/.generated/api/endpoints/auth/auth';
import { useServiceTermsControllerGetAgreementsV1 } from '#/.generated/api/endpoints/service-terms/service-terms';
import { Button, Separator, Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { ActionCard, PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { useHashTab } from '#/lib/use-hash-tab';

import { ProfileChangePasswordModal } from './profile/-components/change-password-modal';
import { ProfileTermsTab } from './profile/-components/terms-tab';
import { ProfileTwoFactorSetupModal } from './profile/-components/two-factor-setup-modal';

const PROFILE_TABS = ['overview', 'terms'] as const;

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
  const agreementsQuery = useServiceTermsControllerGetAgreementsV1();
  const policy = SERVICE_AUTH_POLICY_CONFIG;
  const showPhoneNumber = policy.phoneNumberVerificationRequired || user.phoneNumberVerified;
  const showEmail = policy.emailVerificationRequired || user.emailVerified;
  const showTwoFactor = policy.twoFactorEnabled || policy.twoFactorRequired;
  const agreements = agreementsQuery.data?.items ?? [];
  const agreedCount = agreements.filter((agreement) => agreement.isAgreed).length;
  const [activeTab, setActiveTab] = useHashTab(PROFILE_TABS, 'overview');
  const { identityVerificationId, code, message } = Route.useSearch();
  const router = useRouter();
  const navigate = useNavigate();
  const unregister = useAuthControllerUnregisterV1();
  const queryClient = useQueryClient();
  const { mutate: verifyPhoneNumber, mutateAsync: verifyPhoneNumberAsync, isPending: isVerifying } = useAuthControllerVerifyPhoneNumberV1({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
        await router.invalidate();
      },
    },
  });
  const disableTwoFactor = useAuthControllerDisableTwoFactorV1();
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const processedRef = useRef(false);
  const isBusy = isStarting || isVerifying;
  let verificationButtonLabel = user.phoneNumberVerified ? '전화번호 변경' : '본인인증 시작';
  if (isBusy) verificationButtonLabel = '인증 결과 확인 중...';

  const { isSecure: passwordSecure, description: passwordDescription } = getPasswordStatus(user.providers.includes('credential'), user.passwordUpdatedAt, user.passwordExpired);

  const openPasswordChange = async () => {
    if (!await openModal(ProfileChangePasswordModal)) return;
    await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
    await router.invalidate();
  };

  const unregisterAccount = async () => {
    if (!await confirm({ title: '계정 탈퇴', description: '현재 계정을 탈퇴할까요? 탈퇴 후에는 로그인할 수 없습니다.', confirmLabel: '탈퇴', tone: 'danger' })) return;
    await unregister.mutateAsync();
    queryClient.clear();
    await navigate({ to: '/login', replace: true });
    await router.invalidate();
  };

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
          await verifyPhoneNumberAsync({ data: { identityVerificationId } });
        }
      }
      catch {
        // API 오류는 전역 QueryCache/MutationCache에서 표시합니다.
      }
    }
    void processReturn();
  }, [identityVerificationId, code, message, verifyPhoneNumberAsync]);

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
      verifyPhoneNumber({ data: { identityVerificationId: result.identityVerificationId } });
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
          grid grid-rows-[auto_minmax(0,1fr)] gap-2 p-2
        "
        >
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as (typeof PROFILE_TABS)[number])}
            className="w-full"
          >
            <TabsList variant="line" className="w-full justify-start border-b">
              <TabsTrigger value="overview">
                <User className="size-4" />
                계정 정보
              </TabsTrigger>
              <TabsTrigger value="terms">
                <FileText className="size-4" />
                약관 동의 (
                {agreedCount}
                /
                {agreements.length}
                )
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <main className="scroll-y h-full">
            {activeTab === 'overview' && (
              <div className="grid gap-4">
                <SectionCard textSize="sm" title="보안 및 계정 점검" description="계정 보안을 강화하고 관리할 수 있습니다.">
                  <SectionCard.Content>
                    <div className="grid gap-2 p-2">
                      <div className="grid content-start gap-2 text-xs">
                        {showPhoneNumber && (
                          <ActionCard
                            icon="phone"
                            iconColor={user.phoneNumberVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
                            title="전화번호"
                            description={`${user.phoneNumber || '미등록'} · ${user.phoneNumberVerified ? '인증 완료' : '본인인증 필요'}`}
                            descriptionTone={user.phoneNumberVerified ? 'default' : 'warning'}
                            variant="ghost"
                          >
                            <ActionCard.Actions>
                              <Button type="button" variant="outline" size="sm" disabled={isBusy} onClick={() => void startVerification()}>
                                {verificationButtonLabel}
                              </Button>
                            </ActionCard.Actions>
                          </ActionCard>
                        )}
                        {error && (
                          <p
                            role="alert"
                            className="text-xs text-destructive"
                          >
                            {error}
                          </p>
                        )}
                        {showEmail && (
                          <ActionCard
                            icon="mail"
                            iconColor={user.emailVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
                            title="이메일 계정"
                            description={`${user.email} · ${user.emailVerified ? '인증 완료' : '인증 필요'}`}
                            descriptionTone={user.emailVerified ? 'default' : 'warning'}
                            variant="ghost"
                          />
                        )}
                        {policy.credentialAvailable && (
                          <ActionCard
                            icon="key-round"
                            iconColor={passwordSecure ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
                            title="비밀번호 보안"
                            description={passwordDescription}
                            descriptionTone={passwordSecure ? 'default' : 'error'}
                            variant="ghost"
                          >
                            <ActionCard.Actions>
                              <Button type="button" variant="outline" size="sm" onClick={() => void openPasswordChange()}>비밀번호 변경</Button>
                            </ActionCard.Actions>
                          </ActionCard>
                        )}
                        {showTwoFactor && (
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
                        )}
                        <Separator className="my-1.5" />
                        <ActionCard icon="triangle-alert" iconColor="text-destructive" title="위험 영역" description="계정을 탈퇴하면 다시 로그인할 수 없습니다." variant="destructive">
                          <ActionCard.Actions>
                            <Button type="button" variant="destructive" size="sm" disabled={unregister.isPending} onClick={() => void unregisterAccount()}>계정 탈퇴</Button>
                          </ActionCard.Actions>
                        </ActionCard>
                      </div>
                    </div>
                  </SectionCard.Content>
                </SectionCard>
              </div>
            )}
            {activeTab === 'terms' && <ProfileTermsTab agreements={agreements} />}
          </main>
        </PageSection.Content>
      </PageSection>
    </div>
  );
}

function getPasswordStatus(hasCredential: boolean, updatedAtValue: string | null, passwordExpired: boolean) {
  let description = '비밀번호가 설정되지 않았습니다.';
  if (hasCredential && passwordExpired) description = '비밀번호가 보안 정책상 만료됐습니다. 비밀번호를 변경하세요.';
  else if (hasCredential && updatedAtValue) description = `마지막 변경: ${new Date(updatedAtValue).toLocaleString('ko-KR')}`;
  else if (hasCredential) description = '비밀번호를 설정했습니다.';
  return { description, isSecure: hasCredential && !passwordExpired };
}
