import { useI18n } from '@pkg/shared/web';
import { Clock, MessageSquare, ShieldCheck, Wrench } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';

export type SystemConfigTabType = 'operations' | 'messages' | 'maintenance' | 'security';

type SystemConfigTabsProps = {
  activeTab: SystemConfigTabType
  setActiveTab: (tab: SystemConfigTabType) => void
};

export function SystemConfigTabs({ activeTab, setActiveTab }: SystemConfigTabsProps) {
  const { t } = useI18n();

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => setActiveTab(val as SystemConfigTabType)}
      className="w-full"
    >
      <TabsList
        variant="line"
        className="flex w-full items-center justify-start border-b"
      >
        <TabsTrigger value="operations" className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" />
          <span>{t('systemConfig.tabs.operations')}</span>
        </TabsTrigger>

        <TabsTrigger value="messages" className="flex items-center gap-2">
          <MessageSquare className="size-4 shrink-0" />
          <span>{t('systemConfig.tabs.messages')}</span>
        </TabsTrigger>

        <TabsTrigger value="maintenance" className="flex items-center gap-2">
          <Wrench className="size-4 shrink-0" />
          <span>{t('systemConfig.tabs.maintenance')}</span>
        </TabsTrigger>

        <TabsTrigger value="security" className="flex items-center gap-2">
          <ShieldCheck className="size-4 shrink-0" />
          <span>{t('systemConfig.tabs.security')}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
