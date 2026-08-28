import { useI18n } from '@pkg/shared/web';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { getSystemConfigControllerGetAdminSystemConfigQueryKey, useSystemConfigControllerGetAdminSystemConfig, useSystemConfigControllerUpdateSystemConfig } from '#/.generated/api/endpoints/system-config/system-config';
import type { OperatingHolidayItemDto as HolidayItem, OperatingMaintenanceDto } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { PageSection } from '#/components/app';
import { SectionCard } from '#/components/app/section-card';
import { hasPermission } from '#/core/auth/permissions';

import { MaintenanceTab } from './-components/maintenance-tab';
import { MessagesTab, type OperatingMessagesValue } from './-components/messages-tab';
import { type OperatingHoursValue, OperationsTab } from './-components/operations-tab';
import { type AuthPolicyValue, type InquiryPolicyValue, SecurityTab, type SlackNotificationValue } from './-components/security-tab';
import { SystemConfigTabs, type SystemConfigTabType } from './-components/system-config-tabs';

export const Route = createFileRoute('/_protected/_app/system-management/')({
  beforeLoad: ({ context }) => {
    if (!hasPermission(context.user.permissions, 'system:manage')) {
      throw notFound({ routeId: Route.id });
    }
  },
  component: SystemConfigPage,
});

function SystemConfigPage() {
  const { t } = useI18n();
  const settingsQuery = useSystemConfigControllerGetAdminSystemConfig();

  const configMap = useMemo(() => {
    const map: Record<string, unknown> = {};
    const items = settingsQuery.data?.items;
    if (items && Array.isArray(items)) {
      for (const item of items) {
        map[item.key] = item.value;
      }
    }
    return map;
  }, [settingsQuery.data]);

  return (
    <PageSection icon="settings-2" title={t('systemConfig.pageTitle')} description={t('systemConfig.pageDescription')}>
      <PageSection.Content className="grid grid-rows-[minmax(0,1fr)] p-2">
        {settingsQuery.isLoading
          ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-10 w-80 rounded-lg" />
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          )
          : (
            <SystemConfigMainForm
              key={JSON.stringify(configMap)}
              config={configMap}
            />
          )}
      </PageSection.Content>
    </PageSection>
  );
}

interface SystemConfigMainFormProps {
  config: Record<string, unknown>
}

function SystemConfigMainForm({ config }: SystemConfigMainFormProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const updateSettingMutation = useSystemConfigControllerUpdateSystemConfig();
  const [activeTab, setActiveTab] = useState<SystemConfigTabType>('operations');

  const hours = config['operation.hours'] as Partial<OperatingHoursValue> | undefined;
  const rawHolidays = config['operation.holidays'] as { holidays?: HolidayItem[], items?: HolidayItem[] } | HolidayItem[] | undefined;
  let holidays: HolidayItem[] = [];
  if (Array.isArray(rawHolidays)) {
    holidays = rawHolidays;
  }
  else if (Array.isArray((rawHolidays as { holidays?: HolidayItem[] })?.holidays)) {
    holidays = (rawHolidays as { holidays: HolidayItem[] }).holidays;
  }
  else if (Array.isArray(rawHolidays?.items)) {
    holidays = rawHolidays.items;
  }

  const messages = config['operation.messages'] as Partial<OperatingMessagesValue> | undefined;
  const maintenance = config.maintenance as Partial<OperatingMaintenanceDto> | undefined;
  const authPolicy = config['auth.policy'] as Partial<AuthPolicyValue> | undefined;
  const slackNotification = config['notification.slack'] as Partial<SlackNotificationValue> | undefined;
  const inquiryPolicy = config['inquiry.policy'] as Partial<InquiryPolicyValue> | undefined;

  // 1. Save Operations Tab (hours + holidays)
  const handleSaveOperating = async (payload: {
    hours: OperatingHoursValue
    holidays: HolidayItem[]
  }) => {
    try {
      await Promise.all([
        updateSettingMutation.mutateAsync({
          key: 'operation.hours',
          data: { value: payload.hours },
        }),
        updateSettingMutation.mutateAsync({
          key: 'operation.holidays',
          data: { value: { items: payload.holidays } },
        }),
      ]);
      await queryClient.invalidateQueries({
        queryKey: getSystemConfigControllerGetAdminSystemConfigQueryKey(),
      });
      toast.success('운영시간 및 휴무 설정이 저장되었습니다.');
    }
    catch {
      toast.error('운영시간 설정 저장 중 오류가 발생했습니다.');
    }
  };

  // 2. Save Messages Tab
  const handleSaveMessages = async (payload: OperatingMessagesValue) => {
    try {
      await updateSettingMutation.mutateAsync({
        key: 'operation.messages',
        data: { value: payload },
      });
      await queryClient.invalidateQueries({
        queryKey: getSystemConfigControllerGetAdminSystemConfigQueryKey(),
      });
      toast.success('안내 메시지가 저장되었습니다.');
    }
    catch {
      toast.error('메시지 저장 중 오류가 발생했습니다.');
    }
  };

  // 3. Save Maintenance Tab
  const handleSaveMaintenance = async (maintenance: OperatingMaintenanceDto) => {
    try {
      await updateSettingMutation.mutateAsync({
        key: 'maintenance',
        data: { value: maintenance },
      });
      await queryClient.invalidateQueries({
        queryKey: getSystemConfigControllerGetAdminSystemConfigQueryKey(),
      });
      toast.success('시스템 점검 설정이 저장되었습니다.');
    }
    catch {
      toast.error('점검 설정 저장 중 오류가 발생했습니다.');
    }
  };

  // 4. Save Security & Notifications Tab
  const handleSaveSecurity = async (payload: {
    authPolicy: AuthPolicyValue
    slackNotification: SlackNotificationValue
    inquiryPolicy: InquiryPolicyValue
  }) => {
    try {
      await Promise.all([
        updateSettingMutation.mutateAsync({
          key: 'auth.policy',
          data: { value: payload.authPolicy },
        }),
        updateSettingMutation.mutateAsync({
          key: 'notification.slack',
          data: { value: payload.slackNotification },
        }),
        updateSettingMutation.mutateAsync({
          key: 'inquiry.policy',
          data: { value: payload.inquiryPolicy },
        }),
      ]);
      await queryClient.invalidateQueries({
        queryKey: getSystemConfigControllerGetAdminSystemConfigQueryKey(),
      });
      toast.success('보안 및 알림 설정이 저장되었습니다.');
    }
    catch {
      toast.error('보안 및 알림 설정 저장 중 오류가 발생했습니다.');
    }
  };

  const getActiveTabFormId = () => {
    switch (activeTab) {
      case 'operations':
        return 'operations-form';
      case 'messages':
        return 'messages-form';
      case 'maintenance':
        return 'maintenance-form';
      case 'security':
        return 'security-form';
      default:
        return 'operations-form';
    }
  };

  const handleSaveClick = () => {
    const formId = getActiveTabFormId();
    const formEl = document.getElementById(formId) as HTMLFormElement | null;
    if (formEl) {
      formEl.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true }),
      );
      formEl.requestSubmit();
    }
  };

  return (
    <SectionCard textSize="sm">
      <SectionCard.Content>
        <div className="grid h-full grid-rows-[auto_auto_minmax(0,1fr)]">
          <div className="flex justify-end p-2">
            <Button
              type="button"
              onClick={handleSaveClick}
              disabled={updateSettingMutation.isPending}
              className="h-9 gap-2 font-semibold shadow-xs cursor-pointer"
            >
              <Save className="size-4" />
              {t('systemConfig.saveAll')}
            </Button>
          </div>
          <SystemConfigTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="scroll-y h-full">
            {activeTab === 'operations' && (
              <OperationsTab
                key={`op-${JSON.stringify(hours)}-${JSON.stringify(holidays)}`}
                hours={hours}
                holidays={holidays}
                onSave={handleSaveOperating}
              />
            )}

            {activeTab === 'messages' && (
              <MessagesTab
                key={`msg-${JSON.stringify(messages)}`}
                messages={messages}
                onSave={handleSaveMessages}
              />
            )}

            {activeTab === 'maintenance' && (
              <MaintenanceTab
                key={`maint-${JSON.stringify(maintenance)}`}
                maintenance={maintenance}
                onSave={handleSaveMaintenance}
              />
            )}

            {activeTab === 'security' && (
              <SecurityTab
                key={`sec-${JSON.stringify(authPolicy)}-${JSON.stringify(slackNotification)}-${JSON.stringify(inquiryPolicy)}`}
                authPolicy={authPolicy}
                slackNotification={slackNotification}
                inquiryPolicy={inquiryPolicy}
                onSave={handleSaveSecurity}
              />
            )}
          </main>
        </div>
      </SectionCard.Content>
    </SectionCard>
  );
}
