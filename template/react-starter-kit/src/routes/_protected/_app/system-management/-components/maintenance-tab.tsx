import { when } from '@pkg/shared/common';

import type { OperatingMaintenanceDto } from '#/.generated/api/model';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

export type MaintenanceTabProps = {
  maintenance?: Partial<OperatingMaintenanceDto>
  onSave: (maintenance: OperatingMaintenanceDto) => Promise<void>
};

export function MaintenanceTab({ maintenance, onSave }: MaintenanceTabProps) {
  const { t } = useI18n();

  const initialMessage = maintenance?.message || '시스템 점검 중입니다.';

  const maintenanceForm = useAppForm({
    defaultValues: {
      enabled: Boolean(maintenance?.enabled),
      message: initialMessage,
      scheduledStartAt: when((value): value is string => Boolean(value), (scheduledStartAt) => new Date(scheduledStartAt))(maintenance?.scheduledStartAt),
      scheduledEndAt: when((value): value is string => Boolean(value), (scheduledEndAt) => new Date(scheduledEndAt))(maintenance?.scheduledEndAt),
    },
    onSubmit: async ({ value }) => {
      await onSave({
        enabled: value.enabled,
        message: value.message,
        scheduledStartAt: value.scheduledStartAt?.toISOString() ?? null,
        scheduledEndAt: value.scheduledEndAt?.toISOString() ?? null,
      });
    },
  });

  return (
    <maintenanceForm.AppForm>
      <FormLayout
        id="maintenance-form"
        onSubmit={() => void maintenanceForm.handleSubmit()}
        className="flex flex-col"
      >
        <SectionCard variant="ghost" textSize="base" icon="wrench" title={t('systemConfig.maintenance.title')} description={t('systemConfig.maintenance.description')}>
          <SectionCard.Content>
            <maintenanceForm.AppField name="enabled">
              {(field) => <field.Switch label={t('systemConfig.maintenance.title')} showError={false} />}
            </maintenanceForm.AppField>
            <maintenanceForm.AppField name="enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <div
                    className={cn(
                      'flex flex-col transition-opacity',
                      !isEnabled && 'opacity-60',
                    )}
                  >
                    {/* 점검 안내 문구 */}
                    <maintenanceForm.AppField name="message">
                      {(field) => (
                        <field.Textarea
                          label={t('systemConfig.maintenance.messageLabel')}
                          placeholder={t('systemConfig.maintenance.messagePlaceholder')}
                          rows={2}
                          disabled={!isEnabled}
                        />
                      )}
                    </maintenanceForm.AppField>

                    {/* 점검 일정 (선택) */}
                    <div className="grid grid-cols-1 gap-4">
                      <maintenanceForm.AppField name="scheduledStartAt">
                        {(f) => (
                          <f.DateTimePicker
                            label={t('systemConfig.maintenance.scheduledStartAt')}
                            placeholder={t('systemConfig.maintenance.scheduledStartAt')}
                            disabled={!isEnabled}
                          />
                        )}
                      </maintenanceForm.AppField>

                      <maintenanceForm.AppField name="scheduledEndAt">
                        {(f) => (
                          <f.DateTimePicker
                            label={t('systemConfig.maintenance.scheduledEndAt')}
                            placeholder={t('systemConfig.maintenance.scheduledEndAt')}
                            disabled={!isEnabled}
                          />
                        )}
                      </maintenanceForm.AppField>
                    </div>
                  </div>
                );
              }}
            </maintenanceForm.AppField>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </maintenanceForm.AppForm>
  );
}
