import { DateUtil, z } from '@pkg/shared/common';
import * as PortOne from '@portone/browser-sdk/v2';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { FileText, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { getAuthControllerMeV1QueryKey, getAuthControllerMeV1QueryOptions, useAuthControllerDisableTwoFactorV1, useAuthControllerGetPolicyV1, useAuthControllerUnregisterV1, useAuthControllerVerifyIdentityV1 } from '#/.generated/api/endpoints/auth/auth';
import { useOperatorTermsControllerGetAgreementsV1 } from '#/.generated/api/endpoints/operator-terms/operator-terms';
import { Button, Separator, Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { ActionCard, PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { OPERATOR_TERMS_QUERY_STALE_TIME_MS } from '#/configs/app.config';
import { useHashTab } from '#/lib/use-hash-tab';
import { authUserAtom, clearAuthState } from '#/store/auth';

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

function getPasswordStatus(hasPassword: boolean, updatedAtValue: string | null, passwordExpired: boolean) {
  const updatedAt = updatedAtValue ? new Date(updatedAtValue) : null;

  let description = '비밀번호가 설정되지 않았습니다.';
  if (hasPassword && passwordExpired) description = '비밀번호가 보안 정책상 만료됐습니다. 비밀번호를 변경하세요.';
  else if (hasPassword && updatedAt) description = `마지막 변경: ${DateUtil.dateTime.formatLocale(updatedAt)} · 변경 주기는 시스템 보안 정책을 따릅니다.`;
  else if (hasPassword) description = '비밀번호 변경 주기는 시스템 보안 정책을 따릅니다.';

  return { changeRecommended: passwordExpired, description, isSecure: hasPassword && !passwordExpired };
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
  policy: { twoFactorRequired: boolean, identityVerificationRequired: boolean } | undefined,
  user: { twoFactorEnabled: boolean, phoneNumberVerified: boolean } | null,
): boolean {
  return !(policy?.twoFactorRequired && !user?.twoFactorEnabled)
    && !(policy?.identityVerificationRequired && !user?.phoneNumberVerified);
}

function useIdentityVerificationReturn(params: { identityVerificationId?: string, code?: string, message?: string, activeTab: (typeof PROFILE_TABS)[number] }) {
  const { identityVerificationId, code, message, activeTab } = params;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setUser = useSetAtom(authUserAtom);
  const verifyIdentity = useAuthControllerVerifyIdentityV1();
  const processedRef = useRef(false);
  const [error, setError] = useState<string>(() => (
    code && !code.toUpperCase().includes('CANCEL') ? message || code : ''
  ));

  useEffect(() => {
    if ((!identityVerificationId && !code) || processedRef.current) return;
    processedRef.current = true;
    if (code || !identityVerificationId) return;

    verifyIdentity.mutateAsync({ data: { identityVerificationId } })
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
        const me = await queryClient.fetchQuery(getAuthControllerMeV1QueryOptions());
        setUser(me);
        toast.success('본인인증이 완료됐습니다.');
        await navigate({
          to: '/profile',
          search: { identityVerificationId: undefined, code: undefined, message: undefined },
          hash: activeTab,
          replace: true,
        });
      })
      .catch((verifyError) => {
        setError(verifyError instanceof Error ? verifyError.message : '본인인증 결과를 확인하지 못했습니다.');
      });
  }, [identityVerificationId, code, verifyIdentity, queryClient, setUser, navigate, activeTab]);

  return { error, setError, verifyIdentity };
}

function ProfilePage() {
  const { identityVerificationId, code, message } = Route.useSearch();
  const user = useAtomValue(authUserAtom);
  const setUser = useSetAtom(authUserAtom);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const disableTwoFactor = useAuthControllerDisableTwoFactorV1();
  const unregister = useAuthControllerUnregisterV1();
  const policyQuery = useAuthControllerGetPolicyV1();
  const policy = policyQuery.data;
  const agreementsQuery = useOperatorTermsControllerGetAgreementsV1(undefined, {
    query: {
      staleTime: OPERATOR_TERMS_QUERY_STALE_TIME_MS,
      enabled: policyQuery.isSuccess && canLoadAgreements(policy, user),
    },
  });
  const agreements = agreementsQuery.data?.items ?? [];
  const [activeTab, setActiveTab] = useHashTab(PROFILE_TABS, 'overview');
  const { error: identityVerificationError, setError: setIdentityVerificationError, verifyIdentity } = useIdentityVerificationReturn({ identityVerificationId, code, message, activeTab });
  if (!user) return null;
  const agreedCount = agreements.filter((agreement) => agreement.isAgreed).length;
  const passwordStatus = getPasswordStatus(user.hasPassword, user.passwordUpdatedAt, user.passwordExpired);
  const securityChecks = [
    ...(policy?.emailVerificationRequired || user.emailVerified
      ? [{ label: '이메일 인증', passed: Boolean(user.emailVerified) }]
      : []),
    ...(policy?.identityVerificationRequired || user.phoneNumberVerified
      ? [{ label: '전화번호 인증', passed: Boolean(user.phoneNumberVerified) }]
      : []),
    { label: '2단계 인증', passed: Boolean(user.twoFactorEnabled) },
    { label: '비밀번호 보안', passed: passwordStatus.isSecure },
  ];
  const securityScore = securityChecks.filter((check) => check.passed).length;
  const openPasswordChange = () => {
    void openModal(ProfileChangePasswordModal).then((changed) => {
      if (changed) setUser((current) => current ? { ...current, passwordUpdatedAt: new Date().toISOString(), passwordExpired: false, hasPassword: true } : current);
    });
  };
  const openPhoneVerification = async () => {
    const storeId = String(import.meta.env.VITE_PORTONE_STORE_ID ?? '');
    const channelKey = String(import.meta.env.VITE_PORTONE_IDENTITY_VERIFICATION_CHANNEL_KEY ?? '');
    if (!storeId || !channelKey) {
      toast.error('PortOne 스토어 ID와 본인인증 채널 키를 설정해 주세요.');
      return;
    }
    setIdentityVerificationError('');
    try {
      const result = await PortOne.requestIdentityVerification({
        storeId,
        identityVerificationId: `idv_${crypto.randomUUID()}`,
        channelKey,
        windowType: { pc: 'REDIRECTION', mobile: 'REDIRECTION' },
        redirectUrl: `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`,
      });
      if (!result || result.code) {
        if (result?.code && !result.code.toUpperCase().includes('CANCEL')) toast.error(result.message || '본인인증에 실패했습니다.');
        return;
      }
      await verifyIdentity.mutateAsync({ data: { identityVerificationId: result.identityVerificationId } });
      await queryClient.invalidateQueries({ queryKey: getAuthControllerMeV1QueryKey() });
      const me = await queryClient.fetchQuery(getAuthControllerMeV1QueryOptions());
      setUser(me);
      toast.success('본인인증이 완료됐습니다.');
    }
    catch (error) {
      const errorText = error instanceof Error ? error.message : '본인인증을 완료하지 못했습니다.';
      setIdentityVerificationError(errorText);
      toast.error(errorText);
    }
  };
  const toggleTwoFactor = async () => {
    if (!user.twoFactorEnabled) {
      const enabled = await openModal(ProfileTwoFactorSetupModal, { email: user.email });
      if (enabled) setUser((current) => current ? { ...current, twoFactorEnabled: true } : current);
      return;
    }
    const confirmed = await confirm({ title: '2단계 인증 해제', description: '현재 계정의 2단계 인증을 해제할까요?', confirmLabel: '해제', tone: 'danger' });
    if (!confirmed) return;
    await disableTwoFactor.mutateAsync();
    setUser((current) => current ? { ...current, twoFactorEnabled: false } : current);
  };
  const unregisterAccount = async () => {
    const confirmed = await confirm({ title: '계정 탈퇴', description: '현재 운영자 계정을 탈퇴할까요? 탈퇴 후에는 로그인할 수 없습니다.', confirmLabel: '탈퇴', tone: 'danger' });
    if (!confirmed) return;
    await unregister.mutateAsync();
    clearAuthState();
    await navigate({ to: '/login', replace: true });
  };

  return (
    <PageSection icon="user" title="내 프로필" description="현재 로그인한 운영자 계정과 권한 정보입니다.">
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
              약관 (
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
                      {(policy?.identityVerificationRequired || user.phoneNumberVerified) && (
                        <ActionCard
                          icon="phone"
                          iconColor={getSecurityIconColor(Boolean(user.phoneNumberVerified))}
                          title="전화번호"
                          description={`${user.phoneNumber || '미등록'} · ${user.phoneNumberVerified ? '인증 완료' : '본인인증 필요'}`}
                          descriptionTone={getSecurityTone(Boolean(user.phoneNumberVerified))}
                          variant="ghost"
                        >
                          <ActionCard.Actions>
                            <Button type="button" variant="outline" size="sm" onClick={() => void openPhoneVerification()} disabled={verifyIdentity.isPending}>
                              {user.phoneNumberVerified ? '전화번호 변경' : '휴대폰 인증'}
                            </Button>
                          </ActionCard.Actions>
                        </ActionCard>
                      )}
                      {identityVerificationError && (
                        <p role="alert" className="text-xs text-destructive">
                          {identityVerificationError}
                        </p>
                      )}
                      {(policy?.emailVerificationRequired || user.emailVerified) && (
                        <ActionCard
                          icon="mail"
                          iconColor={getSecurityIconColor(Boolean(user.emailVerified))}
                          title="이메일 계정"
                          description={`${user.email} · ${user.emailVerified ? '인증 완료' : '인증 필요'}`}
                          descriptionTone={getSecurityTone(Boolean(user.emailVerified))}
                          variant="ghost"
                        />
                      )}
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
