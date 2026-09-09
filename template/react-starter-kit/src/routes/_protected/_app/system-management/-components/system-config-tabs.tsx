import { BellRing, Clock, KeyRound, MessageSquare, ShieldCheck, Wrench } from 'lucide-react';

import { SystemConfigKey } from '#/.generated/api/model';
import { Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';
import { useI18n } from '#/hooks';

type SystemConfigTabsProps = {
  activeTab: SystemConfigKey
  setActiveTab: (tab: SystemConfigKey) => void
};

export function SystemConfigTabs({ activeTab, setActiveTab }: SystemConfigTabsProps) {
  const { t } = useI18n();

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => setActiveTab(val as SystemConfigKey)}
      className="w-full"
    >
      <TabsList
        variant="line"
        className="flex w-full items-center justify-start border-b"
      >
        <TabsTrigger
          value="operation"
          className="flex items-center gap-2 cursor-pointer"
        >
          <Clock className="size-4 shrink-0" />
          <span>{t('systemManagement.tabs.operation')}</span>
        </TabsTrigger>

        <TabsTrigger
          value="maintenance"
          className="flex items-center gap-2 cursor-pointer"
        >
          <Wrench className="size-4 shrink-0" />
          <span>{t('systemManagement.tabs.maintenance')}</span>
        </TabsTrigger>

        <TabsTrigger
          value="security"
          className="flex items-center gap-2 cursor-pointer"
        >
          <ShieldCheck className="size-4 shrink-0" />
          <span>{t('systemManagement.tabs.security')}</span>
        </TabsTrigger>

        <TabsTrigger
          value="inquiry"
          className="flex items-center gap-2 cursor-pointer"
        >
          <MessageSquare className="size-4 shrink-0" />
          <span>{t('systemManagement.tabs.inquiry')}</span>
        </TabsTrigger>

        <TabsTrigger
          value="notification"
          className="flex items-center gap-2 cursor-pointer"
        >
          <BellRing className="size-4 shrink-0" />
          <span>{t('systemManagement.tabs.notification')}</span>
        </TabsTrigger>

        <TabsTrigger
          value="oauth"
          className="flex items-center gap-2 cursor-pointer"
        >
          <KeyRound className="size-4 shrink-0" />
          <span>{t('systemManagement.tabs.oauth')}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
