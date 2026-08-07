import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useTermsControllerGetAgreements } from '#/.generated/api/endpoints/terms/terms';
import { Spinner } from '#/.generated/shadcn/components/ui';
import { useAuth } from '#/core/auth/useAuth';

import { AccountManagementCard } from './-components/AccountManagementCard';
import { DashboardHeader } from './-components/DashboardHeader';
import { DashboardTabs, type TabType } from './-components/DashboardTabs';
import { PasswordChangeModal } from './-components/modals/PasswordChangeModal';
import { PasswordChangeBanner } from './-components/PasswordChangeBanner';
import { ProfileSummaryCard } from './-components/ProfileSummaryCard';
import { QuickSummaryCard } from './-components/QuickSummaryCard';
import { SecurityCard } from './-components/SecurityCard';
import { SessionCard } from './-components/SessionCard';
import { TermsAgreementsCard } from './-components/TermsAgreementsCard';

export const Route = createFileRoute('/_protected/dashboard/')({
  component: DashboardPageComponent,
});

function DashboardPageComponent() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { data: agreementsResponse } = useTermsControllerGetAgreements();
  const agreements = agreementsResponse?.data?.terms ?? [];

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      void navigate({ to: '/login' });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="grid justify-items-center gap-3">
          <Spinner className="size-8 text-orange-500" />
          <p className="text-xs font-semibold text-muted-foreground">
            사용자 정보를 불러오는 중입니다...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="
      mx-auto max-w-5xl px-4 py-8
      sm:px-6
      lg:px-8
    "
    >
      <DashboardHeader />

      <PasswordChangeBanner onChangeClick={() => setShowPasswordChangeModal(true)} />

      <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} agreements={agreements} />

      {activeTab === 'overview' && (
        <div className="grid gap-6">
          <div className="
            grid grid-cols-1 gap-6
            md:grid-cols-2
          "
          >
            <ProfileSummaryCard user={user} />
            <SessionCard />
          </div>

          <QuickSummaryCard
            agreements={agreements}
            onOpenPasswordChangeModal={() => setShowPasswordChangeModal(true)}
          />
        </div>
      )}

      {activeTab === 'security' && <SecurityCard />}

      {activeTab === 'terms' && <TermsAgreementsCard agreements={agreements} />}

      {activeTab === 'account' && <AccountManagementCard user={user} />}

      <PasswordChangeModal
        open={showPasswordChangeModal}
        onOpenChange={setShowPasswordChangeModal}
      />
    </div>
  );
}
