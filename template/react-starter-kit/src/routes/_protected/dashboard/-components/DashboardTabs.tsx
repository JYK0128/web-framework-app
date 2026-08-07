import { FileText, Lock, ShieldCheck, User } from 'lucide-react';

import type { TermAgreementItemDto } from '#/.generated/api/model';
import { Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';

export type TabType = 'overview' | 'security' | 'terms' | 'account';

type DashboardTabsProps = {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  agreements?: TermAgreementItemDto[]
};

export function DashboardTabs({ activeTab, setActiveTab, agreements = [] }: DashboardTabsProps) {
  const totalAgreements = agreements.length;
  const agreedCount = agreements.filter((a) => a.isAgreed).length;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => setActiveTab(val as TabType)}
      className="mb-6 w-full"
    >
      <TabsList
        variant="line"
        className="flex w-full items-center justify-start border-b p-0"
      >
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <User className="size-4 shrink-0" />
          <span>개요</span>
        </TabsTrigger>

        <TabsTrigger value="security" className="flex items-center gap-2">
          <ShieldCheck className="size-4 shrink-0" />
          <span>2단계 인증 (2FA)</span>
        </TabsTrigger>

        <TabsTrigger value="terms" className="flex items-center gap-2">
          <FileText className="size-4 shrink-0" />
          <span>
            약관 동의 관리 (
            {agreedCount}
            /
            {totalAgreements}
            )
          </span>
        </TabsTrigger>

        <TabsTrigger value="account" className="flex items-center gap-2">
          <Lock className="size-4 shrink-0" />
          <span>계정 관리</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
