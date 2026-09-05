import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { getSystemConfigControllerGetAdminSystemConfigQueryKey, useSystemConfigControllerGetAdminSystemConfig, useSystemConfigControllerUpdateInquiry, useSystemConfigControllerUpdateMaintenance, useSystemConfigControllerUpdateOperations, useSystemConfigControllerUpdateSecurity } from '#/.generated/api/endpoints/system-config/system-config';
import type { InquiryConfigDto, MaintenanceConfigDto, OperatingHolidayItemDto, OperatingHoursUpdateDto, OperatingMessagesDto, SecurityConfigDto } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { PageSection } from '#/components/layout';
import { hasPermission } from '#/core/auth/permissions';
import { useI18n } from '#/hooks';

import { InquiryTab } from './-components/inquiry-tab';
import { MaintenanceTab } from './-components/maintenance-tab';
import { OperationsTab } from './-components/operations-tab';
import { SecurityTab } from './-components/security-tab';
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
  const queryClient = useQueryClient();
  const settingsQuery = useSystemConfigControllerGetAdminSystemConfig();
  const updateOperationsMutation = useSystemConfigControllerUpdateOperations();
  const updateMaintenanceMutation = useSystemConfigControllerUpdateMaintenance();
  const updateSecurityMutation = useSystemConfigControllerUpdateSecurity();
  const updateInquiryMutation = useSystemConfigControllerUpdateInquiry();

  const [activeTab, setActiveTab] = useState<SystemConfigTabType>('operation');

  const isSaving = updateOperationsMutation.isPending
    || updateMaintenanceMutation.isPending
    || updateSecurityMutation.isPending
    || updateInquiryMutation.isPending;

  const config = settingsQuery.data;

  // 1. Save Operation Tab (hours + holidays + messages)
  const handleSaveOperating = async (payload: {
    hours: OperatingHoursUpdateDto
    holidays: OperatingHolidayItemDto[]
    messages: OperatingMessagesDto
  }) => {
    try {
      await updateOperationsMutation.mutateAsync({
        data: {
          hours: payload.hours,
          holidays: payload.holidays,
          messages: payload.messages,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: getSystemConfigControllerGetAdminSystemConfigQueryKey(),
      });
      toast.success(t('systemManagement.operationSaveSuccess') || '운영 설정이 저장되었습니다.');
    }
    catch {
      toast.error(t('systemManagement.operationSaveError') || '운영 설정 저장 중 오류가 발생했습니다.');
    }
  };

  // 2. Save Maintenance Tab
  const handleSaveMaintenance = async (maintenance: MaintenanceConfigDto) => {
    try {
      await updateMaintenanceMutation.mutateAsync({ data: { maintenance } });
      await queryClient.invalidateQueries({
        queryKey: getSystemConfigControllerGetAdminSystemConfigQueryKey(),
      });
      toast.success(t('systemManagement.maintenanceSaveSuccess') || '시스템 점검 설정이 저장되었습니다.');
    }
    catch {
      toast.error(t('systemManagement.maintenanceSaveError') || '점검 설정 저장 중 오류가 발생했습니다.');
    }
  };

  // 3. Save Security Tab
  const handleSaveSecurity = async (security: SecurityConfigDto) => {
    try {
      await updateSecurityMutation.mutateAsync({
        data: { security },
      });
      await queryClient.invalidateQueries({
        queryKey: getSystemConfigControllerGetAdminSystemConfigQueryKey(),
      });
      toast.success(t('systemManagement.securitySaveSuccess') || '보안 설정이 저장되었습니다.');
    }
    catch {
      toast.error(t('systemManagement.securitySaveError') || '보안 설정 저장 중 오류가 발생했습니다.');
    }
  };

  // 4. Save Inquiry & Notification Tab
  const handleSaveInquiry = async (inquiry: InquiryConfigDto) => {
    try {
      await updateInquiryMutation.mutateAsync({
        data: { inquiry },
      });
      await queryClient.invalidateQueries({
        queryKey: getSystemConfigControllerGetAdminSystemConfigQueryKey(),
      });
      toast.success(t('systemManagement.inquirySaveSuccess') || '문의 및 알림 설정이 저장되었습니다.');
    }
    catch {
      toast.error(t('systemManagement.inquirySaveError') || '문의 및 알림 설정 저장 중 오류가 발생했습니다.');
    }
  };

  const getActiveTabFormId = () => {
    switch (activeTab) {
      case 'operation':
        return 'operations-form';
      case 'maintenance':
        return 'maintenance-form';
      case 'security':
        return 'security-form';
      case 'inquiry':
        return 'inquiry-form';
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
    <PageSection
      icon="settings-2"
      title={t('systemManagement.pageTitle')}
      description={t('systemManagement.pageDescription')}
    >
      <PageSection.Actions>
        <Button
          type="button"
          onClick={handleSaveClick}
          disabled={isSaving || !config}
          className="h-9 gap-2 font-semibold shadow-xs cursor-pointer"
        >
          <Save className="size-4" />
          {t('systemManagement.saveAll')}
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
                {activeTab === 'operation' && (
                  <OperationsTab
                    key={`op-${JSON.stringify(config.operation)}`}
                    operation={config.operation}
                    onSave={handleSaveOperating}
                  />
                )}

                {activeTab === 'maintenance' && (
                  <MaintenanceTab
                    key={`maint-${JSON.stringify(config.maintenance)}`}
                    maintenance={config.maintenance}
                    onSave={handleSaveMaintenance}
                  />
                )}

                {activeTab === 'security' && (
                  <SecurityTab
                    key={`sec-${JSON.stringify(config.security)}`}
                    security={config.security}
                    onSave={handleSaveSecurity}
                  />
                )}

                {activeTab === 'inquiry' && (
                  <InquiryTab
                    key={`inq-${JSON.stringify(config.inquiry)}`}
                    inquiry={config.inquiry}
                    onSave={handleSaveInquiry}
                  />
                )}
              </main>
            </>
          )}
      </PageSection.Content>
    </PageSection>
  );
}
