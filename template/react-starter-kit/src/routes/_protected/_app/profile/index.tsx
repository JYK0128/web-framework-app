import { createFileRoute } from '@tanstack/react-router';
import { FileText, User } from 'lucide-react';

import { useTermsControllerGetAgreements } from '#/.generated/api/endpoints/terms/terms';
import type { AgreementDto } from '#/.generated/api/model';
import { Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { openDialog } from '#/components/dialog';
import { PageSection } from '#/components/layout';
import { useHashTab, useI18n } from '#/hooks';

import { ProfileOverviewTab } from './-components/profile-overview-tab';
import { ProfileTermsTab } from './-components/profile-terms-tab';
import { UserTermDetailDialog } from './-components/user-term-detail-dialog';

const PROFILE_TABS = ['overview', 'terms'] as const;

export const Route = createFileRoute('/_protected/_app/profile/')({
  component: ProfilePageComponent,
});

function ProfilePageComponent() {
  const { t } = useI18n();
  const { user: contextUser } = Route.useRouteContext();
  const [activeTab, setActiveTab] = useHashTab<'overview' | 'terms'>(PROFILE_TABS, 'overview');
  const { data } = useTermsControllerGetAgreements();
  const agreements = data?.items ?? [];

  const agreedCount = agreements.filter((agreement) => agreement.isAgreed).length;

  const handleSelectTerm = (term: AgreementDto) => {
    void openDialog(UserTermDetailDialog, { term }, { dialogId: `user-term-${term.id}` });
  };

  return (
    <PageSection
      icon="user"
      title={t('profile.title')}
      description={t('profile.subtitle')}
    >
      <PageSection.Content className="
        grid grid-rows-[auto_minmax(0,1fr)] gap-2 p-2
      "
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'overview' | 'terms')}
          className="w-full"
        >
          <TabsList
            variant="line"
            className="flex w-full items-center justify-start border-b"
          >
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2"
            >
              <User className="size-4 shrink-0" />
              <span>{t('profile.overview')}</span>
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex items-center gap-2">
              <FileText className="size-4 shrink-0" />
              <span>{t('profile.termsManagement', { agreed: agreedCount, total: agreements.length })}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="scroll-y">
          {
            activeTab === 'overview'
            && <ProfileOverviewTab contextUser={contextUser} />
          }
          {
            activeTab === 'terms'
            && <ProfileTermsTab agreements={agreements} onSelectTerm={handleSelectTerm} />
          }
        </div>
      </PageSection.Content>
    </PageSection>
  );
}
