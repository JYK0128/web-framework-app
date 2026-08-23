import { Clock, MessageSquare, ShieldCheck, Wrench } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';

export type SystemConfigTabType = 'operations' | 'messages' | 'maintenance' | 'security';

type SystemConfigTabsProps = {
  activeTab: SystemConfigTabType
  setActiveTab: (tab: SystemConfigTabType) => void
};

export function SystemConfigTabs({ activeTab, setActiveTab }: SystemConfigTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => setActiveTab(val as SystemConfigTabType)}
      className="w-full"
    >
      <TabsList
        variant="line"
        className="flex w-full items-center justify-start border-b p-0"
      >
        <TabsTrigger value="operations" className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" />
          <span>운영</span>
        </TabsTrigger>

        <TabsTrigger value="messages" className="flex items-center gap-2">
          <MessageSquare className="size-4 shrink-0" />
          <span>안내 메시지</span>
        </TabsTrigger>

        <TabsTrigger value="maintenance" className="flex items-center gap-2">
          <Wrench className="size-4 shrink-0" />
          <span>점검</span>
        </TabsTrigger>

        <TabsTrigger value="security" className="flex items-center gap-2">
          <ShieldCheck className="size-4 shrink-0" />
          <span>보안 및 알림</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
