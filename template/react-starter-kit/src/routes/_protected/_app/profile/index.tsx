import { useI18n } from '@pkg/shared/web';
import { createFileRoute } from '@tanstack/react-router';
import { User } from 'lucide-react';
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

export const Route = createFileRoute('/_protected/_app/profile/')({
  component: ProfilePageComponent,
});

function ProfilePageComponent() {
  const { t } = useI18n();
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
        mx-auto grid size-full max-w-7xl grid-rows-[auto_auto_1fr] gap-6
        overflow-hidden p-6
      "
      >
        {/* Header */}
        <div className="
          flex flex-col gap-4
          sm:flex-row sm:items-center sm:justify-between
        "
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="
                flex size-9 items-center justify-center rounded-lg bg-primary/10
                text-primary shadow-xs
              "
              >
                <User className="size-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t('profile.title')}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('profile.subtitle')}
            </p>
          </div>
        </div>

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
