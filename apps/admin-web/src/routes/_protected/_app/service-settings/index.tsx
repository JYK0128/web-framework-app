import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { RefreshCw, Save } from 'lucide-react';
import { useRef } from 'react';

import { useSystemConfigControllerSyncConfigsV1 } from '#/.generated/api/endpoints/system-configs/system-configs';
import type { UpdateServiceConfigRequestDto } from '#/.generated/api/model';
import { Button, Skeleton } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { PageSection } from '#/components/layout';
import { useHashTab } from '#/lib/use-hash-tab';

import { InquiryTab, type InquiryTabHandle } from './-components/inquiry-tab';
import { MaintenanceTab, type MaintenanceTabHandle } from './-components/maintenance-tab';
import { OperationsTab, type OperationsTabHandle } from './-components/operations-tab';
import { getServiceConfigQueryKey, useServiceConfigQuery, useUpdateServiceConfigMutation } from './-components/service-config-api';
import { SystemConfigTabs } from './-components/system-config-tabs';

const SYSTEM_CONFIG_TABS = [
  'operation',
  'maintenance',
  'inquiry',
] as const;
type SystemConfigKey = (typeof SYSTEM_CONFIG_TABS)[number];

export const Route = createFileRoute('/_protected/_app/service-settings/')({ component: SystemConfigPage });

function SystemConfigPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useServiceConfigQuery();
  const updateSystemConfigMutation = useUpdateServiceConfigMutation();
  const syncSystemConfigMutation = useSystemConfigControllerSyncConfigsV1();

  const [activeTab, setActiveTab] = useHashTab<SystemConfigKey>(SYSTEM_CONFIG_TABS, 'operation');

  const operationsRef = useRef<OperationsTabHandle>(null);
  const maintenanceRef = useRef<MaintenanceTabHandle>(null);
  const inquiryRef = useRef<InquiryTabHandle>(null);

  const isSaving = updateSystemConfigMutation.isPending;
  const config = settingsQuery.data;

  const handleSaveClick = async () => {
    if (!config) return;

    // 1. 모든 탭 폼 검증 및 데이터 수집
    const [operationData, maintenanceData, inquiryData] = await Promise.all([
      operationsRef.current?.submitData(),
      maintenanceRef.current?.submitData(),
      inquiryRef.current?.submitData(),
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
    if (!inquiryData) {
      setActiveTab('inquiry');
      return;
    }

    const payload: UpdateServiceConfigRequestDto = {
      operation: operationData,
      maintenance: maintenanceData,
      inquiry: inquiryData,
    };

    updateSystemConfigMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: getServiceConfigQueryKey(),
          });
        },
      },
    );
  };

  return (
    <PageSection
      icon="settings-2"
      title="서비스 설정"
      description="운영자가 관리하는 서비스 운영시간, 점검 및 문의 처리 정책을 설정합니다."
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
          {syncSystemConfigMutation.isPending ? '동기화 중...' : '동기화'}
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
