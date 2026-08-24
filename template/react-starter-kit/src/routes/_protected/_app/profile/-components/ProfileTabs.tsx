import { useI18n } from '@pkg/shared/web';
import { FileText, User } from 'lucide-react';

import type { TermAgreementItemDto } from '#/.generated/api/model';
import { Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';

export type TabType = 'overview' | 'terms';

type ProfileTabsProps = {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  agreements?: TermAgreementItemDto[]
};

export function ProfileTabs({ activeTab, setActiveTab, agreements = [] }: ProfileTabsProps) {
  const { t } = useI18n();
  const totalAgreements = agreements.length;
  const agreedCount = agreements.filter((a) => a.isAgreed).length;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => setActiveTab(val as TabType)}
      className="w-full"
    >
      <TabsList
        variant="line"
        className="flex w-full items-center justify-start border-b p-0"
      >
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <User className="size-4 shrink-0" />
          <span>{t('profile.overview')}</span>
        </TabsTrigger>

        <TabsTrigger value="terms" className="flex items-center gap-2">
          <FileText className="size-4 shrink-0" />
          <span>
            {t('profile.termsManagement', { agreed: agreedCount, total: totalAgreements })}
          </span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
