import { DateUtil } from '@pkg/shared/common';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { FileText, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAuthControllerDisableTwoFactorV1, useAuthControllerUnregisterV1 } from '#/.generated/api/endpoints/auth/auth';
import { useTermsControllerGetAgreementsV1 } from '#/.generated/api/endpoints/terms/terms';
import { Button, Separator } from '#/.generated/shadcn/components/ui';
import { confirm } from '#/components/app/system-dialog';
import { ActionCard, PageSection, SectionCard } from '#/components/layout';
import { openModal } from '#/components/modal';
import { useHashTab } from '#/lib/use-hash-tab';
import { authUserAtom, clearAuthState } from '#/store/auth';

import { ChangePasswordModal, TwoFactorSetupModal } from './-profile-security-modals';
import { ProfileTermsTab } from './-profile-terms-tab';

const PROFILE_TABS = ['overview', 'terms'] as const;
const PASSWORD_CHANGE_RECOMMENDATION_DAYS = 90;

export const Route = createFileRoute('/_protected/_app/profile')({ component: ProfilePage });

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

function getPasswordStatus(hasPassword: boolean, updatedAtValue: string | null, today: number) {
  const updatedAt = updatedAtValue ? new Date(updatedAtValue) : null;
  const ageDays = updatedAt
    ? Math.max(0, Math.floor((today - updatedAt.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const changeRecommended = ageDays !== null && ageDays >= PASSWORD_CHANGE_RECOMMENDATION_DAYS;

  let description = '비밀번호가 설정되지 않았습니다.';
  if (hasPassword && changeRecommended) description = `마지막 변경 후 ${ageDays}일이 지났습니다. 비밀번호를 변경하세요.`;
  else if (hasPassword && updatedAt) description = `마지막 변경: ${DateUtil.dateTime.formatLocale(updatedAt)} · 90일 주기 변경 권장`;
  else if (hasPassword) description = '비밀번호가 설정되어 있습니다. 90일 주기로 변경하세요.';

  return { changeRecommended, description, isSecure: hasPassword && !changeRecommended };
}

function getSecurityTone(checked: boolean): 'default' | 'warning' {
  return checked ? 'default' : 'warning';
}

function getSecurityIconColor(checked: boolean): string {
  return checked ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
}

function ProfilePage() {
  const user = useAtomValue(authUserAtom);
  const setUser = useSetAtom(authUserAtom);
  const navigate = useNavigate();
  const disableTwoFactor = useAuthControllerDisableTwoFactorV1();
  const unregister = useAuthControllerUnregisterV1();
  const agreementsQuery = useTermsControllerGetAgreementsV1(undefined, {
    query: { staleTime: 30_000 },
  });
  const agreements = agreementsQuery.data?.data.items ?? [];
  const [activeTab, setActiveTab] = useHashTab(PROFILE_TABS, 'overview');
  const [today] = useState(() => Date.now());
  if (!user) return null;
  const agreedCount = agreements.filter((agreement) => agreement.isAgreed).length;
  const passwordStatus = getPasswordStatus(user.hasPassword, user.passwordUpdatedAt, today);
  const securityChecks = [
    { label: '이메일 인증', passed: Boolean(user.emailVerified) },
    { label: '전화번호 인증', passed: Boolean(user.phoneNumberVerified) },
    { label: '2단계 인증', passed: Boolean(user.twoFactorEnabled) },
    { label: '비밀번호 보안', passed: passwordStatus.isSecure },
  ];
  const securityScore = securityChecks.filter((check) => check.passed).length;
  const openPasswordChange = () => {
    void openModal(ChangePasswordModal).then((changed) => {
      if (changed) setUser((current) => current ? { ...current, passwordUpdatedAt: new Date().toISOString(), hasPassword: true } : current);
    });
  };
  const openPhoneVerificationMock = () => {
    toast.info('휴대폰 본인인증 기능은 준비 중입니다.');
  };
  const toggleTwoFactor = async () => {
    if (!user.twoFactorEnabled) {
      const enabled = await openModal(TwoFactorSetupModal, { email: user.email });
      if (enabled) setUser((current) => current ? { ...current, twoFactorEnabled: true } : current);
      return;
    }
    const confirmed = await confirm({ title: '2단계 인증 해제', description: '현재 계정의 2단계 인증을 해제할까요?', confirmLabel: '해제', tone: 'danger' });
    if (!confirmed) return;
    await disableTwoFactor.mutateAsync();
    setUser((current) => current ? { ...current, twoFactorEnabled: false } : current);
  };
  const unregisterAccount = async () => {
    const confirmed = await confirm({ title: '계정 탈퇴', description: '현재 관리자 계정을 탈퇴할까요? 탈퇴 후에는 로그인할 수 없습니다.', confirmLabel: '탈퇴', tone: 'danger' });
    if (!confirmed) return;
    await unregister.mutateAsync();
    clearAuthState();
    await navigate({ to: '/login', replace: true });
  };

  return (
    <PageSection icon="user" title="내 프로필" description="현재 로그인한 관리자 계정과 권한 정보입니다.">
      <PageSection.Content className="
        grid grid-rows-[auto_minmax(0,1fr)] gap-2 p-2
      "
      >
        <div className="flex w-full items-center justify-start border-b">
          <Button
            variant="ghost"
            className={activeTab === 'overview'
              ? `rounded-none border-b-2 border-primary`
              : `rounded-none`}
            onClick={() => setActiveTab('overview')}
          >
            <User className="size-4" />
            계정 정보
          </Button>
          <Button
            variant="ghost"
            className={activeTab === 'terms'
              ? `rounded-none border-b-2 border-primary`
              : `rounded-none`}
            onClick={() => setActiveTab('terms')}
          >
            <FileText className="size-4" />
            약관
            {' '}
            (
            {agreedCount}
            /
            {agreements.length}
            )
          </Button>
        </div>
        <div className="scroll-y">
          {activeTab === 'overview' && (
            <div className="grid gap-4">
              <SectionCard textSize="sm" title="보안 및 계정 점검" description="계정 보안을 강화하고 관리할 수 있습니다.">
                <SectionCard.Actions>
                  <SecurityScoreBadge passedCount={securityScore} totalCount={securityChecks.length} />
                </SectionCard.Actions>
                <SectionCard.Content>
                  <div className="grid gap-2 p-2">
                    <div className="grid content-start gap-2 text-xs">
                      <ActionCard
                        icon="phone"
                        iconColor={getSecurityIconColor(Boolean(user.phoneNumberVerified))}
                        title="전화번호"
                        description={`${user.phoneNumber || '미등록'} · ${user.phoneNumberVerified ? '인증 완료' : '본인인증 필요'}`}
                        descriptionTone={getSecurityTone(Boolean(user.phoneNumberVerified))}
                        variant="ghost"
                      >
                        {!user.phoneNumberVerified && (
                          <ActionCard.Actions>
                            <Button type="button" variant="outline" size="sm" onClick={openPhoneVerificationMock}>
                              휴대폰 인증
                            </Button>
                          </ActionCard.Actions>
                        )}
                      </ActionCard>
                      <ActionCard
                        icon="mail"
                        iconColor={getSecurityIconColor(Boolean(user.emailVerified))}
                        title="이메일 계정"
                        description={`${user.email} · ${user.emailVerified ? '인증 완료' : '인증 필요'}`}
                        descriptionTone={getSecurityTone(Boolean(user.emailVerified))}
                        variant="ghost"
                      />
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
                        description={user.twoFactorEnabled ? '2단계 인증이 활성화되어 있습니다.' : '계정 보안을 위해 2단계 인증을 설정하세요.'}
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
        </div>
      </PageSection.Content>
    </PageSection>
  );
}
