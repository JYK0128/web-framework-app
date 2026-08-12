import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { useTermsControllerGetAgreements } from '#/.generated/api/endpoints/terms/terms';

import { AccountManagementCard } from './-components/AccountManagementCard';
import { PasswordChangeModal } from './-components/modals/PasswordChangeModal';
import { PasswordChangeBanner } from './-components/PasswordChangeBanner';
import { ProfileHeader } from './-components/ProfileHeader';
import { ProfileSummaryCard } from './-components/ProfileSummaryCard';
import { ProfileTabs, type TabType } from './-components/ProfileTabs';
import { QuickSummaryCard } from './-components/QuickSummaryCard';
import { SecurityCard } from './-components/SecurityCard';
import { SessionCard } from './-components/SessionCard';
import { TermHistoryCard } from './-components/TermHistoryCard';
import { TermsAgreementsCard } from './-components/TermsAgreementsCard';

export const Route = createFileRoute('/_protected/profile/')({
  component: ProfilePageComponent,
});

function ProfilePageComponent() {
  const { user, expiresAt } = Route.useRouteContext();
  const { data: agreementsResponse } = useTermsControllerGetAgreements();
  const agreements = agreementsResponse?.terms ?? [];

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);

  return (
    <>
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden p-6">
        <ProfileHeader />

        <PasswordChangeBanner
          user={user}
          onChangeClick={() => setShowPasswordChangeModal(true)}
        />

        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} agreements={agreements} />

        <main className="min-h-0 flex-1 scroll-y">
          {activeTab === 'overview' && (
            <div className="grid gap-6">
              <div className="
                grid grid-cols-1 gap-6
                md:grid-cols-2
              "
              >
                <ProfileSummaryCard user={user} />
                <SessionCard expiresAt={expiresAt} />
              </div>

              <QuickSummaryCard
                user={user}
                agreements={agreements}
                onOpenPasswordChangeModal={() => setShowPasswordChangeModal(true)}
              />
            </div>
          )}

          {activeTab === 'security' && <SecurityCard user={user} />}

          {activeTab === 'terms' && (
            <div className="grid gap-6">
              <TermsAgreementsCard agreements={agreements} />
              <TermHistoryCard />
            </div>
          )}

          {activeTab === 'account' && <AccountManagementCard user={user} />}
        </main>
      </div>

      <PasswordChangeModal
        user={user}
        open={showPasswordChangeModal}
        onOpenChange={setShowPasswordChangeModal}
      />
    </>
  );
}
