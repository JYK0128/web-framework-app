import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { RefreshCw, Save } from 'lucide-react';
import { useRef, useState } from 'react';

import { useSystemConfigControllerSyncConfigsV1, useSystemConfigControllerUpdateConfigsV1 } from '#/.generated/api/endpoints/system-configs/system-configs';
import type { UpdateSystemSettingsRequestDto } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { PageSection } from '#/components/layout';
import { useHashTab } from '#/lib/use-hash-tab';
import { DeliveryTab, type DeliveryTabHandle } from '#/routes/_protected/_app/service-settings/-components/delivery-tab';
import { OAuthTab, type OAuthTabHandle } from '#/routes/_protected/_app/service-settings/-components/oauth-tab';
import { WebhookTab, type WebhookTabHandle } from '#/routes/_protected/_app/service-settings/-components/webhook-tab';

import { AdminEmailSettingsTab, type AdminEmailSettingsTabHandle } from './-components/admin-email-settings-tab';
import { PortoneIdentityTool } from './-components/portone-identity-tool';
import { getSystemSettingsQueryKey, useSystemSettingsQuery } from './-components/system-config-api';
import { type SystemSettingKey, SystemSettingTabs } from './-components/system-setting-tabs';

const SYSTEM_SETTING_TABS = ['delivery', 'oauth', 'notifications'] as const;

export const Route = createFileRoute('/_protected/_app/system-settings/')({ component: SystemSettingsPage });

function SystemSettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useSystemSettingsQuery();
  const updateMutation = useSystemConfigControllerUpdateConfigsV1();
  const syncMutation = useSystemConfigControllerSyncConfigsV1();
  const [activeTab, setActiveTab] = useHashTab<SystemSettingKey>(SYSTEM_SETTING_TABS, 'delivery');
  const deliveryRef = useRef<DeliveryTabHandle>(null);
  const oauthRef = useRef<OAuthTabHandle>(null);
  const webhookRef = useRef<WebhookTabHandle>(null);
  const adminEmailRef = useRef<AdminEmailSettingsTabHandle>(null);
  const config = settingsQuery.data;
  const [settingsRevision, setSettingsRevision] = useState(0);

  const refreshSettings = async () => {
    await queryClient.invalidateQueries({ queryKey: getSystemSettingsQueryKey() });
    setSettingsRevision((revision) => revision + 1);
  };

  const handleSave = async () => {
    if (!config) return;
    const [delivery, oauth, webhook, adminEmail] = await Promise.all([
      deliveryRef.current?.submitData(),
      oauthRef.current?.submitData(),
      webhookRef.current?.submitData(),
      adminEmailRef.current?.submitData(),
    ]);
    if (delivery === null) return setActiveTab('delivery');
    if (oauth === null) return setActiveTab('oauth');
    if (webhook === null) return setActiveTab('notifications');
    if (adminEmail === null) return setActiveTab('notifications');

    const payload: UpdateSystemSettingsRequestDto = {
      ...(delivery
        ? {
          delivery: {
            ...delivery,
            messenger: { ...delivery.messenger, enabled: delivery.messenger?.enabled ?? false, provider: delivery.messenger?.provider ?? 'KAKAO' },
            sms: { ...delivery.sms, enabled: delivery.sms?.enabled ?? false, provider: delivery.sms?.provider ?? 'NHN_SMS' },
            push: { ...delivery.push, enabled: delivery.push?.enabled ?? false, provider: delivery.push?.provider ?? 'FCM' },
          },
        }
        : {}),
      ...(oauth ? { oauth } : {}),
      ...(webhook ? { webhook } : {}),
      ...(adminEmail ? { adminEmail } : {}),
    };
    if (Object.keys(payload).length === 0) return;

    updateMutation.mutate({ data: payload }, {
      onSuccess: () => {
        oauthRef.current?.commitPendingUploads();
        void refreshSettings();
      },
    });
  };

  const isLoading = settingsQuery.isLoading || !config;
  const isSaving = updateMutation.isPending;

  return (
    <PageSection icon="server-cog" title="시스템 설정" description="발송 채널, 소셜 로그인 키와 시스템 알림 설정을 관리합니다.">
      <PageSection.Actions>
        <Button
          type="button"
          variant="outline"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending || isSaving || !config}
          className="h-9 min-w-28 gap-2 font-semibold cursor-pointer"
        >
          <RefreshCw className={cn('size-4', syncMutation.isPending && `
            animate-spin
          `)}
          />
          {syncMutation.isPending ? '동기화 중...' : '동기화'}
        </Button>
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving || !config}
          className="h-9 min-w-24 gap-2 font-semibold shadow-xs cursor-pointer"
        >
          <Save className="size-4" />
          저장
        </Button>
      </PageSection.Actions>
      <PageSection.Content className="
        grid grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-y-auto p-2
      "
      >
        {isLoading
          ? <Skeleton className="h-96 w-full rounded-2xl" />
          : (
            <div className="grid grid-rows-[auto_minmax(0,1fr)] gap-4">
              <SystemSettingTabs activeTab={activeTab} setActiveTab={setActiveTab} />
              <main className="scroll-y h-full">
                <div className={cn(activeTab !== 'delivery' && 'hidden')}>
                  <div className="grid gap-6">
                    <DeliveryTab key={`delivery-${settingsRevision}-${JSON.stringify(config.delivery)}`} ref={deliveryRef} delivery={config.delivery} />
                    <PortoneIdentityTool />
                  </div>
                </div>
                <div className={cn(activeTab !== 'oauth' && 'hidden')}><OAuthTab key={`oauth-${settingsRevision}-${JSON.stringify(config.oauth)}`} ref={oauthRef} oauth={config.oauth} /></div>
                <div className={cn(activeTab !== 'notifications' && 'hidden')}>
                  <div className="grid gap-6">
                    <WebhookTab key={`webhook-${settingsRevision}-${JSON.stringify(config.webhook)}`} ref={webhookRef} webhook={config.webhook} />
                    <AdminEmailSettingsTab key={`admin-email-${settingsRevision}-${JSON.stringify(config.adminEmail)}`} ref={adminEmailRef} adminEmail={config.adminEmail} />
                  </div>
                </div>
              </main>
            </div>
          )}
      </PageSection.Content>
    </PageSection>
  );
}
