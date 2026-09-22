import { BellRing, Clock, KeyRound, MessageSquare, ShieldCheck, Wrench } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '#/.generated/shadcn/components/ui';

type SystemConfigKey = 'operation' | 'maintenance' | 'security' | 'inquiry' | 'notification' | 'oauth';

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
          <span>{"운영 설정"}</span>
        </TabsTrigger>

        <TabsTrigger
          value="maintenance"
          className="flex items-center gap-2 cursor-pointer"
        >
          <Wrench className="size-4 shrink-0" />
          <span>{"시스템 점검"}</span>
        </TabsTrigger>

        <TabsTrigger
          value="security"
          className="flex items-center gap-2 cursor-pointer"
        >
          <ShieldCheck className="size-4 shrink-0" />
          <span>{"보안 정책"}</span>
        </TabsTrigger>

        <TabsTrigger
          value="inquiry"
          className="flex items-center gap-2 cursor-pointer"
        >
          <MessageSquare className="size-4 shrink-0" />
          <span>{"문의 정책"}</span>
        </TabsTrigger>

        <TabsTrigger
          value="notification"
          className="flex items-center gap-2 cursor-pointer"
        >
          <BellRing className="size-4 shrink-0" />
          <span>{"알림 발송"}</span>
        </TabsTrigger>

        <TabsTrigger
          value="oauth"
          className="flex items-center gap-2 cursor-pointer"
        >
          <KeyRound className="size-4 shrink-0" />
          <span>{"소셜 로그인"}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
