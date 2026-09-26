import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { RefreshCw, Save } from 'lucide-react';
import { useRef } from 'react';

import { getSystemConfigControllerGetConfigsV1QueryKey, useSystemConfigControllerGetConfigsV1, useSystemConfigControllerSyncConfigsV1, useSystemConfigControllerUpdateConfigsV1 } from '#/.generated/api/endpoints/system-config/system-config';
import type { UpdateSystemConfigRequestDto } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { PageSection } from '#/components/layout';
import { useHashTab } from '#/lib/use-hash-tab';

import { InquiryTab, type InquiryTabHandle } from './-components/inquiry-tab';
import { MaintenanceTab, type MaintenanceTabHandle } from './-components/maintenance-tab';
import { NotificationTab, type NotificationTabHandle } from './-components/notification-tab';
import { OAuthTab, type OAuthTabHandle } from './-components/oauth-tab';
import { OperationsTab, type OperationsTabHandle } from './-components/operations-tab';
import { SecurityTab, type SecurityTabHandle } from './-components/security-tab';
import { SystemConfigTabs } from './-components/system-config-tabs';

const SYSTEM_CONFIG_TABS = [
  'operation',
  'maintenance',
  'security',
  'inquiry',
  'notification',
  'oauth',
] as const;
type SystemConfigKey = (typeof SYSTEM_CONFIG_TABS)[number];

export const Route = createFileRoute('/_protected/_app/system-management/')({ component: SystemConfigPage });

function SystemConfigPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useSystemConfigControllerGetConfigsV1();
  const updateSystemConfigMutation = useSystemConfigControllerUpdateConfigsV1();
  const syncSystemConfigMutation = useSystemConfigControllerSyncConfigsV1();

  const [activeTab, setActiveTab] = useHashTab<SystemConfigKey>(SYSTEM_CONFIG_TABS, 'operation');

  const operationsRef = useRef<OperationsTabHandle>(null);
  const maintenanceRef = useRef<MaintenanceTabHandle>(null);
  const securityRef = useRef<SecurityTabHandle>(null);
  const inquiryRef = useRef<InquiryTabHandle>(null);
  const notificationRef = useRef<NotificationTabHandle>(null);
  const oauthRef = useRef<OAuthTabHandle>(null);

  const isSaving = updateSystemConfigMutation.isPending;
  const config = settingsQuery.data?.data;

  const handleSaveClick = async () => {
    if (!config) return;

    // 1. 모든 탭 폼 검증 및 데이터 수집
    const [operationData, maintenanceData, securityData, inquiryData, notificationData, oauthData] = await Promise.all([
      operationsRef.current?.submitData(),
      maintenanceRef.current?.submitData(),
      securityRef.current?.submitData(),
      inquiryRef.current?.submitData(),
      notificationRef.current?.submitData(),
      oauthRef.current?.submitData(),
    ]);

    // 하나라도 유효성 검사 실패 시 (null 반환) 해당 탭으로 포커스 후 제출 중단
    if (!operationData) {
      setActiveTab('operation');
      return;
    }
    if (!maintenanceData) {
      setActiveTab('maintenance');
      return;
    }
    if (!securityData) {
      setActiveTab('security');
      return;
    }
    if (!inquiryData) {
      setActiveTab('inquiry');
      return;
    }
    if (!notificationData) {
      setActiveTab('notification');
      return;
    }
    if (!oauthData) {
      setActiveTab('oauth');
      return;
    }

    // Older notification settings may omit disabled-channel discriminators.
    // Keep those channels disabled while sending the DTO shape required by the API.
    notificationData.messenger = {
      ...notificationData.messenger,
      enabled: notificationData.messenger?.enabled ?? false,
      provider: notificationData.messenger?.provider ?? 'KAKAO',
    };
    notificationData.sms = {
      ...notificationData.sms,
      enabled: notificationData.sms?.enabled ?? false,
      provider: notificationData.sms?.provider ?? 'NHN_SMS',
    };
    notificationData.push = {
      ...notificationData.push,
      enabled: notificationData.push?.enabled ?? false,
      provider: notificationData.push?.provider ?? 'FCM',
    };

    const payload: UpdateSystemConfigRequestDto = {
      operation: operationData,
      maintenance: maintenanceData,
      security: securityData,
      inquiry: inquiryData,
      notification: notificationData,
      oauth: oauthData,
    };

    updateSystemConfigMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          oauthRef.current?.commitPendingUploads();
          void queryClient.invalidateQueries({
            queryKey: getSystemConfigControllerGetConfigsV1QueryKey(),
          });
        },
      },
    );
  };

  return (
    <PageSection
      icon="settings-2"
      title="서비스 설정"
      description="고객센터 운영시간, 공휴일, 점검, 보안, 알림 및 소셜 로그인 설정을 관리합니다."
    >
      <PageSection.Actions>
        <Button
          type="button"
          variant="outline"
          onClick={() => syncSystemConfigMutation.mutate()}
          disabled={syncSystemConfigMutation.isPending || isSaving || !config}
          className="h-9 min-w-28 gap-2 font-semibold cursor-pointer"
        >
          <RefreshCw
            className={cn('size-4', syncSystemConfigMutation.isPending && `
              animate-spin
            `)}
          />
          {syncSystemConfigMutation.isPending ? '동기화 중...' : 'Redis 동기화'}
        </Button>
        <Button
          type="button"
          onClick={() => void handleSaveClick()}
          disabled={isSaving || !config}
          className="h-9 min-w-24 gap-2 font-semibold shadow-xs cursor-pointer"
        >
          <Save className="size-4" />
          저장
        </Button>
      </PageSection.Actions>

      <PageSection.Content className="
        grid grid-rows-[auto_minmax(0,1fr)] gap-4 p-2
      "
      >
        {settingsQuery.isLoading || !config
          ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-10 w-80 rounded-lg" />
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          )
          : (
            <>
              <SystemConfigTabs activeTab={activeTab} setActiveTab={setActiveTab} />
              <main className="scroll-y h-full">
                <div className={cn(activeTab !== 'operation' && 'hidden')}>
                  <OperationsTab
                    key={`op-${JSON.stringify(config.operation)}`}
                    ref={operationsRef}
                    operation={config.operation}
                  />
                </div>

                <div className={cn(activeTab !== 'maintenance' && 'hidden')}>
                  <MaintenanceTab
                    key={`maint-${JSON.stringify(config.maintenance)}`}
                    ref={maintenanceRef}
                    maintenance={config.maintenance}
                  />
                </div>

                <div className={cn(activeTab !== 'security' && 'hidden')}>
                  <SecurityTab
                    key={`sec-${JSON.stringify(config.security)}`}
                    ref={securityRef}
                    security={config.security}
                  />
                </div>

                <div className={cn(activeTab !== 'inquiry' && 'hidden')}>
                  <InquiryTab
                    key={`inq-${JSON.stringify(config.inquiry)}`}
                    ref={inquiryRef}
                    inquiry={config.inquiry}
                  />
                </div>

                <div className={cn(activeTab !== 'notification' && 'hidden')}>
                  <NotificationTab
                    key={`noti-${JSON.stringify(config.notification)}`}
                    ref={notificationRef}
                    notification={config.notification}
                  />
                </div>

                <div className={cn(activeTab !== 'oauth' && 'hidden')}>
                  <OAuthTab
                    key={`oauth-${JSON.stringify(config.oauth)}`}
                    ref={oauthRef}
                    oauth={config.oauth}
                  />
                </div>
              </main>
            </>
          )}
      </PageSection.Content>
    </PageSection>
  );
}
