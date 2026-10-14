import { ApplicationError } from '@pkg/shared/common';
import { PageSection } from '@pkg/web-core/layout';
import { cn } from '@pkg/web-core/utils';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Save } from 'lucide-react';
import { useRef, useState } from 'react';

import { useSystemConfigControllerUpdateConfigsV1 } from '#/.generated/api/endpoints/system-configs/system-configs';
import type { UpdateSystemConfigResponseDto, UpdateSystemSettingsRequestDto } from '#/.generated/api/model';
import { SystemConfigControllerUpdateConfigsV1Response } from '#/.generated/api/zod/system-configs/system-configs';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { useHashTab } from '#/hooks/use-hash-tab';

import { AdminEmailSettingsTab, type AdminEmailSettingsTabHandle } from './-components/admin-email-settings-tab';
import { NotificationTab, type NotificationTabHandle } from './-components/notification-tab';
import { OAuthTab, type OAuthTabHandle } from './-components/oauth-tab';
import { PortoneIdentityTool } from './-components/portone-identity-tool';
import { getSystemSettingsQueryKey, useSystemSettingsQuery } from './-components/system-config-api';
import { type SystemSettingKey, SystemSettingTabs } from './-components/system-setting-tabs';
import { WebhookTab, type WebhookTabHandle } from './-components/webhook-tab';

const CONFIG_LABELS: Record<string, string> = { adminEmail: '관리자 이메일', webhook: '회사 메신저 웹훅', notification: '고객 노티피케이션', oauth: 'OAuth' };

const SYSTEM_SETTING_TABS = ['notification', 'oauth', 'notifications'] as const;

export const Route = createFileRoute('/_protected/_app/system-settings/')({ component: SystemSettingsPage });

function SystemSettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useSystemSettingsQuery();
  const updateMutation = useSystemConfigControllerUpdateConfigsV1();
  const [activeTab, setActiveTab] = useHashTab<SystemSettingKey>(SYSTEM_SETTING_TABS, 'notification');
  const notificationRef = useRef<NotificationTabHandle>(null);
  const oauthRef = useRef<OAuthTabHandle>(null);
  const webhookRef = useRef<WebhookTabHandle>(null);
  const adminEmailRef = useRef<AdminEmailSettingsTabHandle>(null);
  const config = settingsQuery.data;
  const [settingsRevision, setSettingsRevision] = useState(0);
  const [retryInput, setRetryInput] = useState<UpdateSystemSettingsRequestDto | null>(null);
  const [saveResult, setSaveResult] = useState<UpdateSystemConfigResponseDto | null>(null);

  const refreshSettings = async () => {
    await queryClient.invalidateQueries({ queryKey: getSystemSettingsQueryKey() });
    setSettingsRevision((revision) => revision + 1);
  };

  const saveConfigs = (payload: UpdateSystemSettingsRequestDto) => {
    updateMutation.mutate({ data: payload }, {
      onSuccess: () => {
        setRetryInput(null);
        setSaveResult(null);
        oauthRef.current?.commitPendingUploads();
        void refreshSettings();
      },
      onError: (error) => {
        if (!(error instanceof ApplicationError) || error.code !== 'SYSTEM_CONFIG_UPDATE_INCOMPLETE') return;
        const result = SystemConfigControllerUpdateConfigsV1Response.shape.data.safeParse(error.details);
        if (!result.success) return;
        setSaveResult(result.data);
        setRetryInput(payload);
      },
    });
  };

  const handleSave = async () => {
    if (retryInput) return saveConfigs(retryInput);
    if (!config) return;
    const [notification, oauth, webhook, adminEmail] = await Promise.all([
      notificationRef.current?.submitData(),
      oauthRef.current?.submitData(),
      webhookRef.current?.submitData(),
      adminEmailRef.current?.submitData(),
    ]);
    if (notification === null) return setActiveTab('notification');
    if (oauth === null) return setActiveTab('oauth');
    if (webhook === null) return setActiveTab('notifications');
    if (adminEmail === null) return setActiveTab('notifications');

    const payload: UpdateSystemSettingsRequestDto = {
      ...(notification
        ? {
          notification: {
            ...notification,
            messenger: { ...notification.messenger, enabled: notification.messenger?.enabled ?? false, provider: notification.messenger?.provider ?? 'KAKAO' },
            sms: { ...notification.sms, enabled: notification.sms?.enabled ?? false, provider: notification.sms?.provider ?? 'NHN_SMS' },
            push: { ...notification.push, enabled: notification.push?.enabled ?? false, provider: notification.push?.provider ?? 'FCM' },
          },
        }
        : {}),
      ...(oauth ? { oauth } : {}),
      ...(webhook ? { webhook } : {}),
      ...(adminEmail ? { adminEmail } : {}),
    };
    if (Object.keys(payload).length === 0) return;

    saveConfigs(payload);
  };

  const isLoading = settingsQuery.isLoading || !config;
  const isSaving = updateMutation.isPending;

  return (
    <PageSection icon="server-cog" title="시스템 설정" description="발송 채널, 소셜 로그인 키와 시스템 알림 설정을 관리합니다.">
      <PageSection.Actions>
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving || !config}
          className="h-9 min-w-24 gap-2 font-semibold shadow-xs cursor-pointer"
        >
          <Save className="size-4" />
          {retryInput ? '저장 재시도' : '저장'}
        </Button>
      </PageSection.Actions>
      <PageSection.Content className="
        grid grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden p-2
      "
      >
        {isLoading
          ? <Skeleton className="h-96 w-full rounded-2xl" />
          : (
            <div className="
              grid grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden
            "
            >
              <div className="grid gap-3">
                <SystemSettingTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                {saveResult && (
                  <div role="alert" className="rounded-md border p-3 text-sm">
                    <p>
                      저장 확인:
                      {saveResult.updatedKeys.map((key) => CONFIG_LABELS[key] ?? key).join(', ') || '없음'}
                    </p>
                    <p>
                      서비스 반영 미확인:
                      {saveResult.unconfirmedKeys.map((key) => CONFIG_LABELS[key] ?? key).join(', ')}
                    </p>
                    <p>입력값을 유지했습니다. 저장 재시도를 누르면 마지막 요청을 다시 보냅니다.</p>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => {
                        setRetryInput(null);
                        setSaveResult(null);
                      }}
                    >
                      계속 수정
                    </Button>
                  </div>
                )}
              </div>
              <main className="scroll-y h-full">
                <fieldset
                  disabled={isSaving || retryInput !== null}
                  className="contents"
                >
                  <div className={cn(activeTab !== 'notification' && 'hidden')}>
                    <div className="grid gap-6">
                      <NotificationTab key={`notification-${settingsRevision}-${JSON.stringify(config.notification)}`} ref={notificationRef} notification={config.notification} />
                      <PortoneIdentityTool />
                    </div>
                  </div>
                  <div className={cn(activeTab !== 'oauth' && 'hidden', activeTab === 'oauth' && `
                    lg:h-full lg:overflow-hidden
                  `)}
                  >
                    <OAuthTab key={`oauth-${settingsRevision}-${JSON.stringify(config.oauth)}`} ref={oauthRef} oauth={config.oauth} />
                  </div>
                  <div className={cn(activeTab !== 'notifications' && 'hidden')}>
                    <div className="grid gap-6">
                      <WebhookTab key={`webhook-${settingsRevision}-${JSON.stringify(config.webhook)}`} ref={webhookRef} webhook={config.webhook} />
                      <AdminEmailSettingsTab key={`admin-email-${settingsRevision}-${JSON.stringify(config.adminEmail)}`} ref={adminEmailRef} adminEmail={config.adminEmail} />
                    </div>
                  </div>
                </fieldset>
              </main>
            </div>
          )}
      </PageSection.Content>
    </PageSection>
  );
}
