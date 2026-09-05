import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { Save } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { getSystemConfigControllerGetAdminSystemConfigQueryKey, useSystemConfigControllerGetAdminSystemConfig, useSystemConfigControllerUpdateSystemConfig } from '#/.generated/api/endpoints/system-config/system-config';
import type { UpdateSystemConfigRequestDto } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { PageSection } from '#/components/layout';
import { hasPermission } from '#/core/auth/permissions';
import { useI18n } from '#/hooks';

import { InquiryTab, type InquiryTabHandle } from './-components/inquiry-tab';
import { MaintenanceTab, type MaintenanceTabHandle } from './-components/maintenance-tab';
import { OperationsTab, type OperationsTabHandle } from './-components/operations-tab';
import { SecurityTab, type SecurityTabHandle } from './-components/security-tab';
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
  const updateSystemConfigMutation = useSystemConfigControllerUpdateSystemConfig();

  const [activeTab, setActiveTab] = useState<SystemConfigTabType>('operation');

  const operationsRef = useRef<OperationsTabHandle>(null);
  const maintenanceRef = useRef<MaintenanceTabHandle>(null);
  const securityRef = useRef<SecurityTabHandle>(null);
  const inquiryRef = useRef<InquiryTabHandle>(null);

  const isSaving = updateSystemConfigMutation.isPending;
  const config = settingsQuery.data;

  const handleSaveClick = async () => {
    if (!config) return;

    try {
      // 1. 모든 탭 폼 검증 및 데이터 수집
      const [operationData, maintenanceData, securityData, inquiryData] = await Promise.all([
        operationsRef.current?.submitData(),
        maintenanceRef.current?.submitData(),
        securityRef.current?.submitData(),
        inquiryRef.current?.submitData(),
      ]);

      // 하나라도 유효성 검사 실패 시 (null 반환) 제출 중단
      if (!operationData) {
        setActiveTab('operation');
        toast.error(t('systemManagement.validationError') || '운영 설정 항목을 확인해 주세요.');
        return;
      }
      if (!maintenanceData) {
        setActiveTab('maintenance');
        toast.error(t('systemManagement.validationError') || '점검 설정 항목을 확인해 주세요.');
        return;
      }
      if (!securityData) {
        setActiveTab('security');
        toast.error(t('systemManagement.validationError') || '보안 설정 항목을 확인해 주세요.');
        return;
      }
      if (!inquiryData) {
        setActiveTab('inquiry');
        toast.error(t('systemManagement.validationError') || '문의 및 알림 설정 항목을 확인해 주세요.');
        return;
      }

      const payload: UpdateSystemConfigRequestDto = {
        operation: operationData,
        maintenance: maintenanceData,
        security: securityData,
        inquiry: inquiryData,
      };

      await updateSystemConfigMutation.mutateAsync({ data: payload });
      await queryClient.invalidateQueries({
        queryKey: getSystemConfigControllerGetAdminSystemConfigQueryKey(),
      });
      toast.success(t('systemManagement.saveSuccess') || '전체 시스템 설정이 성공적으로 저장되었습니다.');
    }
    catch {
      toast.error(t('systemManagement.saveError') || '시스템 설정 저장 중 오류가 발생했습니다.');
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
          onClick={() => void handleSaveClick()}
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
              </main>
            </>
          )}
      </PageSection.Content>
    </PageSection>
  );
}
