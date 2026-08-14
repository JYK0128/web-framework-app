import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { useTermsControllerGetAgreements } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementDto } from '#/.generated/api/model';

import { AccountManagementCard } from './-components/AccountManagementCard';
import { AgreementHistoryCard } from './-components/AgreementHistoryCard';
import { PasswordChangeModal } from './-components/modals/PasswordChangeModal';
import { ProfileSummaryCard } from './-components/ProfileSummaryCard';
import { ProfileTabs, type TabType } from './-components/ProfileTabs';
import { QuickSummaryCard } from './-components/QuickSummaryCard';
import { SecurityCard } from './-components/SecurityCard';
import { TermsAgreementsCard } from './-components/TermsAgreementsCard';

export const Route = createFileRoute('/_protected/profile/')({
  component: ProfilePageComponent,
});

function ProfilePageComponent() {
  const { user: contextUser } = Route.useRouteContext();
  const [user, setUser] = useState(contextUser);
  const { data: agreementsResponse } = useTermsControllerGetAgreements();
  const [agreementOverrides, setAgreementOverrides] = useState<Record<string, boolean>>({});

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);

  const agreements = useMemo<AgreementDto[]>(() => (
    (agreementsResponse?.terms ?? []).map((agreement) => (
      agreement.id in agreementOverrides
        ? { ...agreement, isAgreed: agreementOverrides[agreement.id] }
        : agreement
    ))
  ), [agreementOverrides, agreementsResponse?.terms]);

  const handleAgreementChanged = (termId: string, isAgreed: boolean) => {
    setAgreementOverrides((currentOverrides) => ({
      ...currentOverrides,
      [termId]: isAgreed,
    }));
  };

  const handlePasswordChanged = () => {
    setUser((currentUser) => ({
      ...currentUser,
      isPasswordChangeRequired: false,
      passwordUpdatedAt: new Date().toISOString(),
    }));
  };

  const handleTwoFactorChanged = (enabled: boolean) => {
    setUser((currentUser) => ({
      ...currentUser,
      twoFactorEnabled: enabled,
    }));
  };

  return (
    <>
      <div className="
        mx-auto grid size-full max-w-7xl grid-rows-[auto_1fr] overflow-hidden
        p-6
      "
      >
        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} agreements={agreements} />

        <main className="scroll-y">
          {activeTab === 'overview' && (
            <div className="grid gap-6">
              <div className="
                grid grid-cols-1 gap-6
                md:grid-cols-2
              "
              >
                <ProfileSummaryCard user={user} />
              </div>

              <QuickSummaryCard
                user={user}
                agreements={agreements}
              />
            </div>
          )}

          {activeTab === 'security' && (
            <SecurityCard user={user} onTwoFactorChanged={handleTwoFactorChanged} />
          )}

          {activeTab === 'terms' && (
            <div className="grid gap-6">
              <TermsAgreementsCard
                agreements={agreements}
                onAgreementChanged={handleAgreementChanged}
              />
              <AgreementHistoryCard />
            </div>
          )}

          {activeTab === 'account' && (
            <AccountManagementCard
              user={user}
              onChangePassword={() => setShowPasswordChangeModal(true)}
            />
          )}
        </main>
      </div>

      <PasswordChangeModal
        user={user}
        open={showPasswordChangeModal}
        onOpenChange={setShowPasswordChangeModal}
        onPasswordChanged={handlePasswordChanged}
      />
    </>
  );
}
