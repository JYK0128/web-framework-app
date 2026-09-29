import { Bell, BellRing, KeyRound } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';

export type SystemSettingKey = 'delivery' | 'oauth' | 'notifications';

export function SystemSettingTabs({ activeTab, setActiveTab }: { activeTab: SystemSettingKey, setActiveTab: (tab: SystemSettingKey) => void }) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as SystemSettingKey)}
      className="w-full"
    >
      <TabsList
        variant="line"
        className="flex w-full items-center justify-start border-b"
      >
        <TabsTrigger
          value="delivery"
          className="flex items-center gap-2 cursor-pointer"
        >
          <BellRing className="size-4 shrink-0" />
          <span>발송 채널</span>
        </TabsTrigger>
        <TabsTrigger
          value="oauth"
          className="flex items-center gap-2 cursor-pointer"
        >
          <KeyRound className="size-4 shrink-0" />
          <span>소셜 로그인</span>
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className="flex items-center gap-2 cursor-pointer"
        >
          <Bell className="size-4 shrink-0" />
          <span>시스템 알림</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
