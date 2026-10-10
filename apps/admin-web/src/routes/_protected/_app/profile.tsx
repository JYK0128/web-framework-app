import { DateUtil, z } from '@pkg/shared/common';
import { ADMIN_AUTH_POLICY_CONFIG } from '@pkg/shared/policy';
import * as PortOne from '@portone/browser-sdk/v2';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { FileText, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { getAuthControllerMeV1QueryKey, useAuthControllerDisableTwoFactorV1, useAuthControllerUnregisterV1, useAuthControllerVerifyPhoneNumberV1 } from '#/.generated/api/endpoints/auth/auth';
import { useOperatorTermsControllerGetAgreementsV1 } from '#/.generated/api/endpoints/operator-terms/operator-terms';
import type { MeResponse } from '#/.generated/api/model';
import { Button, Separator, Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { ActionCard, PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { useHashTab } from '#/hooks/use-hash-tab';

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

function SecurityScoreBadge({ passedCount, totalCount }: { passedCount: number, totalCount: number }) {
  const isExcellent = passedCount === totalCount;
  const isWarning = passedCount <= 2;
  let className = 'bg-secondary text-secondary-foreground';
  if (isExcellent) className = 'bg-primary text-primary-foreground';
  else if (isWarning) className = 'bg-destructive text-destructive-foreground';

  return (
    <span className={`
      inline-flex rounded-md px-2 py-1 text-xs font-semibold
      ${className}
    `}
    >
      {passedCount}
      /
      {totalCount}
      {isWarning && ' 보안 강화 권장'}
    </span>
  );
}

function getPasswordStatus(hasCredential: boolean, updatedAtValue: string | null, passwordExpired: boolean) {
  const updatedAt = updatedAtValue ? new Date(updatedAtValue) : null;

  let description = '비밀번호가 설정되지 않았습니다.';
  if (hasCredential && passwordExpired) description = '계정 보호를 위해 새 비밀번호로 변경해 주세요.';
  else if (hasCredential && updatedAt) description = `마지막 변경: ${DateUtil.dateTime.formatLocale(updatedAt)}`;
  else if (hasCredential) description = '비밀번호가 설정되어 있습니다.';

  return { changeRecommended: passwordExpired, description, isSecure: hasCredential && !passwordExpired };
}

function getSecurityTone(checked: boolean): 'default' | 'warning' {
  return checked ? 'default' : 'warning';
}

function getSecurityIconColor(checked: boolean): string {
  return checked ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
}

function getTwoFactorDescription(enabled: boolean): string {
  if (enabled) return '2단계 인증이 활성화되어 있습니다.';
  return '계정 보안을 위해 2단계 인증을 설정하세요.';
}

function canLoadAgreements(
  policy: { twoFactorRequired: boolean, phoneNumberVerificationRequired: boolean },
  user: { twoFactorEnabled: boolean, phoneNumberVerified: boolean } | null,
): boolean {
  return !(policy.twoFactorRequired && !user?.twoFactorEnabled)
    && !(policy.phoneNumberVerificationRequired && !user?.phoneNumberVerified);
}

function usePhoneNumberVerificationReturn(params: { identityVerificationId?: string, code?: string, message?: string }) {
  const { identityVerificationId, code, message } = params;
  const queryClient = useQueryClient();
  const router = useRouter();
  const verifyPhoneNumber = useAuthControllerVerifyPhoneNumberV1({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
        await router.invalidate();
      },
    },
  });
  const processedRef = useRef(false);
  const [error, setError] = useState<string>(() => (
    code && !code.toUpperCase().includes('CANCEL') ? message || code : ''
  ));

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
  }, [identityVerificationId, code, message, verifyPhoneNumber, queryClient, router]);

  return { error, setError, verifyPhoneNumber };
}

function ProfilePage() {
  const { identityVerificationId, code, message } = Route.useSearch();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();
  const disableTwoFactor = useAuthControllerDisableTwoFactorV1();
  const unregister = useAuthControllerUnregisterV1();
  const policy = ADMIN_AUTH_POLICY_CONFIG;
  const agreementsQuery = useOperatorTermsControllerGetAgreementsV1(undefined, {
    query: {
      enabled: canLoadAgreements(policy, user ?? null),
    },
  });
  const agreements = agreementsQuery.data?.items ?? [];
  const [activeTab, setActiveTab] = useHashTab(PROFILE_TABS, 'overview');
  const { error: phoneNumberVerificationError, setError: setPhoneNumberVerificationError, verifyPhoneNumber } = usePhoneNumberVerificationReturn({ identityVerificationId, code, message });
  if (!user) return null;
  const updateUser = async (update: (current: MeResponse) => MeResponse) => {
    queryClient.setQueryData<MeResponse>(getAuthControllerMeV1QueryKey(), (current) => current ? update(current) : current);
    await router.invalidate();
  };
  const agreedCount = agreements.filter((agreement) => agreement.isAgreed).length;
  const passwordStatus = getPasswordStatus(user.providers.includes('credential'), user.passwordUpdatedAt, user.passwordExpired);
  const securityChecks = [
    ...(policy.emailVerificationRequired || user.emailVerified
      ? [{ label: '이메일 인증', passed: Boolean(user.emailVerified) }]
      : []),
    ...(policy.phoneNumberVerificationRequired || user.phoneNumberVerified
      ? [{ label: '전화번호 인증', passed: Boolean(user.phoneNumberVerified) }]
      : []),
    ...(policy.twoFactorEnabled || policy.twoFactorRequired
      ? [{ label: '2단계 인증', passed: Boolean(user.twoFactorEnabled) }]
      : []),
    ...(policy.credentialAvailable ? [{ label: '비밀번호 보안', passed: passwordStatus.isSecure }] : []),
  ];
  const securityScore = securityChecks.filter((check) => check.passed).length;
  const openPasswordChange = () => {
    void openModal(ProfileChangePasswordModal).then(async (changed) => {
      if (changed) await updateUser((current) => ({ ...current, passwordUpdatedAt: new Date().toISOString(), passwordExpired: false, providers: current.providers.includes('credential') ? current.providers : [...current.providers, 'credential'] }));
    });
  };
  const openPhoneVerification = async () => {
    const storeId = String(import.meta.env.VITE_PORTONE_STORE_ID ?? '');
    const channelKey = String(import.meta.env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY ?? '');
    if (!storeId || !channelKey) {
      setPhoneNumberVerificationError('지금은 본인인증을 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setPhoneNumberVerificationError('');
    try {
      const redirectUrl = new URL(window.location.href);
      for (const key of ['identityVerificationId', 'code', 'message']) redirectUrl.searchParams.delete(key);
      const result = await PortOne.requestIdentityVerification({
        storeId,
        identityVerificationId: `idv_${crypto.randomUUID()}`,
        channelKey,
        windowType: { pc: 'REDIRECTION', mobile: 'REDIRECTION' },
        redirectUrl: redirectUrl.toString(),
      });
      if (!result || result.code) {
        if (result?.code && !result.code.toUpperCase().includes('CANCEL')) setPhoneNumberVerificationError(result.message || '본인인증에 실패했습니다.');
        return;
      }
      verifyPhoneNumber.mutate({ data: { identityVerificationId: result.identityVerificationId } });
    }
    catch (error) {
      const errorText = error instanceof Error ? error.message : '본인인증을 완료하지 못했습니다.';
      setPhoneNumberVerificationError(errorText);
    }
  };
  const toggleTwoFactor = async () => {
    if (!user.twoFactorEnabled) {
      const enabled = await openModal(ProfileTwoFactorSetupModal, { email: user.email });
      if (enabled) await updateUser((current) => ({ ...current, twoFactorEnabled: true }));
      return;
    }
    const confirmed = await confirm({ title: '2단계 인증 해제', description: '현재 계정의 2단계 인증을 해제할까요?', confirmLabel: '해제', tone: 'danger' });
    if (!confirmed) return;
    await disableTwoFactor.mutateAsync();
    await updateUser((current) => ({ ...current, twoFactorEnabled: false }));
  };
  const unregisterAccount = async () => {
    const confirmed = await confirm({ title: '계정 탈퇴', description: '현재 계정을 탈퇴할까요? 탈퇴 후에는 로그인할 수 없습니다.', confirmLabel: '탈퇴', tone: 'danger' });
    if (!confirmed) return;
    await unregister.mutateAsync();
    queryClient.removeQueries({ queryKey: getAuthControllerMeV1QueryKey() });
    await navigate({ to: '/login', replace: true });
  };

  return (
    <PageSection icon="user" title="내 프로필" description="현재 로그인한 계정과 권한 정보입니다.">
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
                <SectionCard.Actions>
                  <SecurityScoreBadge passedCount={securityScore} totalCount={securityChecks.length} />
                </SectionCard.Actions>
                <SectionCard.Content>
                  <div className="grid gap-2 p-2">
                    <div className="grid content-start gap-2 text-xs">
                      {(policy.phoneNumberVerificationRequired || user.phoneNumberVerified) && (
                        <ActionCard
                          icon="phone"
                          iconColor={getSecurityIconColor(Boolean(user.phoneNumberVerified))}
                          title="전화번호"
                          description={`${user.phoneNumber || '미등록'} · ${user.phoneNumberVerified ? '인증 완료' : '본인인증 필요'}`}
                          descriptionTone={getSecurityTone(Boolean(user.phoneNumberVerified))}
                          variant="ghost"
                        >
                          <ActionCard.Actions>
                            <Button type="button" variant="outline" size="sm" onClick={() => void openPhoneVerification()} disabled={verifyPhoneNumber.isPending}>
                              {user.phoneNumberVerified ? '전화번호 변경' : '휴대폰 인증'}
                            </Button>
                          </ActionCard.Actions>
                        </ActionCard>
                      )}
                      {phoneNumberVerificationError && (
                        <p role="alert" className="text-xs text-destructive">
                          {phoneNumberVerificationError}
                        </p>
                      )}
                      {(policy.emailVerificationRequired || user.emailVerified) && (
                        <ActionCard
                          icon="mail"
                          iconColor={getSecurityIconColor(Boolean(user.emailVerified))}
                          title="이메일 계정"
                          description={`${user.email} · ${user.emailVerified ? '인증 완료' : '인증 필요'}`}
                          descriptionTone={getSecurityTone(Boolean(user.emailVerified))}
                          variant="ghost"
                        />
                      )}
                      {policy.credentialAvailable && (
                        <ActionCard
                          icon="key-round"
                          iconColor={getSecurityIconColor(passwordStatus.isSecure)}
                          title="비밀번호 보안"
                          description={passwordStatus.description}
                          descriptionTone={passwordStatus.isSecure ? 'default' : 'error'}
                          variant="ghost"
                        >
                          <ActionCard.Actions>
                            <Button type="button" variant="outline" size="sm" onClick={openPasswordChange}>
                              비밀번호 변경
                            </Button>
                          </ActionCard.Actions>
                        </ActionCard>
                      )}
                      {(policy.twoFactorEnabled || policy.twoFactorRequired) && (
                        <ActionCard
                          icon={user.twoFactorEnabled ? 'shield-check' : 'triangle-alert'}
                          iconColor={getSecurityIconColor(Boolean(user.twoFactorEnabled))}
                          title="2단계 인증"
                          description={getTwoFactorDescription(user.twoFactorEnabled)}
                          descriptionTone={getSecurityTone(Boolean(user.twoFactorEnabled))}
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
                      <ActionCard
                        icon="triangle-alert"
                        iconColor="text-destructive"
                        title="위험 영역"
                        description="계정을 탈퇴하면 다시 로그인할 수 없습니다."
                        variant="destructive"
                      >
                        <ActionCard.Actions>
                          <Button type="button" variant="destructive" size="sm" disabled={unregister.isPending} onClick={() => void unregisterAccount()}>
                            계정 탈퇴
                          </Button>
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
  );
}
