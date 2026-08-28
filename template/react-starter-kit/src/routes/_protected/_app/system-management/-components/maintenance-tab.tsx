import { useI18n } from '@pkg/shared/web';

import type { OperatingMaintenanceDto } from '#/.generated/api/model';
import { cn } from '#/.generated/shadcn/lib/utils';
import { SectionCard } from '#/components/app/section-card';
import { FormLayout, useAppForm } from '#/components/form';

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
      scheduledStartAt: maintenance?.scheduledStartAt ? new Date(maintenance.scheduledStartAt) : undefined,
      scheduledEndAt: maintenance?.scheduledEndAt ? new Date(maintenance.scheduledEndAt) : undefined,
    },
    onSubmit: async ({ value }) => {
      await onSave({
        enabled: value.enabled,
        message: value.message,
        scheduledStartAt: value.scheduledStartAt ?? null,
        scheduledEndAt: value.scheduledEndAt ?? null,
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
          <SectionCard.Actions>
            <maintenanceForm.AppField name="enabled">
              {(field) => <field.Switch />}
            </maintenanceForm.AppField>
          </SectionCard.Actions>
          <SectionCard.Content>
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
