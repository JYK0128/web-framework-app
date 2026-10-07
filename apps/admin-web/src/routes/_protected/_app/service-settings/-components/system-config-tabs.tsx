import { Clock, MessageSquare, Wrench } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';

type SystemConfigKey = 'operation' | 'maintenance' | 'inquiry';

type SystemConfigTabsProps = {
  activeTab: SystemConfigKey
  setActiveTab: (tab: SystemConfigKey) => void
};

export function SystemConfigTabs({ activeTab, setActiveTab }: SystemConfigTabsProps) {
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
          <span>운영 정책</span>
        </TabsTrigger>

        <TabsTrigger
          value="maintenance"
          className="flex items-center gap-2 cursor-pointer"
        >
          <Wrench className="size-4 shrink-0" />
          <span>점검 정책</span>
        </TabsTrigger>

        <TabsTrigger
          value="inquiry"
          className="flex items-center gap-2 cursor-pointer"
        >
          <MessageSquare className="size-4 shrink-0" />
          <span>문의 정책</span>
        </TabsTrigger>

      </TabsList>
    </Tabs>
  );
}
