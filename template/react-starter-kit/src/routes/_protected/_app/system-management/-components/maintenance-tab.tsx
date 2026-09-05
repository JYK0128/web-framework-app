import { forwardRef, useImperativeHandle } from 'react';

import type { MaintenanceConfigDto } from '#/.generated/api/model';
import { Button, Switch } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';
import { DAYS_OF_WEEK } from '#/routes/_protected/_app/system-management/-configs/operations.config';

interface DaySelectorProps {
  days: number[]
  disabled?: boolean
  onChange: (days: number[]) => void
}

function DaySelector({ days, disabled, onChange }: DaySelectorProps) {
  const handleToggle = (day: number) => {
    if (days.includes(day)) {
      onChange(days.filter((val) => val !== day));
    }
    else {
      onChange([...days, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {DAYS_OF_WEEK.map((d) => {
        const isSelected = days.includes(d.value);
        return (
          <Button
            key={d.value}
            type="button"
            size="sm"
            variant={isSelected ? 'default' : 'outline'}
            disabled={disabled}
            onClick={() => handleToggle(d.value)}
            className={cn(
              'size-9 p-0 font-medium cursor-pointer',
              !isSelected && `
                hover:bg-muted
                text-muted-foreground
              `,
            )}
          >
            {d.label}
          </Button>
        );
      })}
    </div>
  );
}

export interface MaintenanceTabHandle {
  submitData: () => Promise<MaintenanceConfigDto | null>
}

export type MaintenanceTabProps = {
  maintenance?: Partial<MaintenanceConfigDto>
};

export const MaintenanceTab = forwardRef<MaintenanceTabHandle, MaintenanceTabProps>(function MaintenanceTab(
  { maintenance }: MaintenanceTabProps,
  ref,
) {
  const { t } = useI18n();

  const maintenanceForm = useAppForm({
    defaultValues: {
      temporary: {
        enabled: Boolean(maintenance?.temporary?.enabled),
        message: maintenance?.temporary?.message || '현재 시스템 점검 중입니다. 점검 완료 후 정상 이용 가능합니다.',
        startAt: maintenance?.temporary?.startAt ? new Date(maintenance.temporary.startAt) : undefined,
        endAt: maintenance?.temporary?.endAt ? new Date(maintenance.temporary.endAt) : undefined,
      },
      recurring: {
        enabled: Boolean(maintenance?.recurring?.enabled),
        message: maintenance?.recurring?.message || '정기 시스템 점검 시간입니다. 점검 시간 동안 서비스 이용이 일시 중단됩니다.',
        daysOfWeek: maintenance?.recurring?.daysOfWeek ?? [4],
        startTime: maintenance?.recurring?.startTime ?? '02:00',
        endTime: maintenance?.recurring?.endTime ?? '04:00',
      },
    },
  });

  useImperativeHandle(ref, () => ({
    submitData: async () => {
      const isValid = await maintenanceForm.validateAllFields('submit');
      if (!isValid) {
        return null;
      }
      const value = maintenanceForm.state.values;
      return {
        temporary: {
          enabled: value.temporary.enabled,
          message: value.temporary.message,
          startAt: value.temporary.startAt?.toISOString() ?? null,
          endAt: value.temporary.endAt?.toISOString() ?? null,
        },
        recurring: {
          enabled: value.recurring.enabled,
          message: value.recurring.message,
          daysOfWeek: value.recurring.daysOfWeek,
          startTime: value.recurring.startTime,
          endTime: value.recurring.endTime,
        },
      };
    },
  }));

  return (
    <maintenanceForm.AppForm>
      <FormLayout
        id="maintenance-form"
        onSubmit={() => void maintenanceForm.handleSubmit()}
        className="flex flex-col gap-6"
      >
        {/* 1. 임시 점검 설정 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="wrench"
          title={t('systemManagement.maintenance.temporaryTitle')}
          description={t('systemManagement.maintenance.temporaryDescription')}
        >
          <SectionCard.Actions>
            <maintenanceForm.AppField name="temporary.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label={t('systemManagement.maintenance.temporaryTitle')}
                />
              )}
            </maintenanceForm.AppField>
          </SectionCard.Actions>
          <SectionCard.Content>
            <maintenanceForm.AppField name="temporary.enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <div
                    className={cn(
                      'flex flex-col gap-4 transition-opacity',
                      !isEnabled && 'opacity-60',
                    )}
                  >
                    {/* 점검 일정 (선택) */}
                    <div className="grid grid-cols-2 gap-4">
                      <maintenanceForm.AppField name="temporary.startAt">
                        {(f) => (
                          <f.DateTimePicker
                            label={t('systemManagement.maintenance.startAt')}
                            placeholder={t('systemManagement.maintenance.startAt')}
                            disabled={!isEnabled}
                          />
                        )}
                      </maintenanceForm.AppField>

                      <maintenanceForm.AppField name="temporary.endAt">
                        {(f) => (
                          <f.DateTimePicker
                            label={t('systemManagement.maintenance.endAt')}
                            placeholder={t('systemManagement.maintenance.endAt')}
                            disabled={!isEnabled}
                          />
                        )}
                      </maintenanceForm.AppField>
                    </div>

                    {/* 임시 점검 안내 문구 */}
                    <maintenanceForm.AppField name="temporary.message">
                      {(field) => (
                        <field.Textarea
                          label={t('systemManagement.maintenance.messageLabel')}
                          placeholder={t('systemManagement.maintenance.temporaryMessagePlaceholder')}
                          rows={2}
                          disabled={!isEnabled}
                        />
                      )}
                    </maintenanceForm.AppField>
                  </div>
                );
              }}
            </maintenanceForm.AppField>
          </SectionCard.Content>
        </SectionCard>

        {/* 2. 정기 점검 설정 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="calendar-clock"
          title={t('systemManagement.maintenance.recurringTitle')}
          description={t('systemManagement.maintenance.recurringDescription')}
        >
          <SectionCard.Actions>
            <maintenanceForm.AppField name="recurring.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label={t('systemManagement.maintenance.recurringTitle')}
                />
              )}
            </maintenanceForm.AppField>
          </SectionCard.Actions>
          <SectionCard.Content>
            <maintenanceForm.AppField name="recurring.enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <div
                    className={cn(
                      'flex flex-col gap-4 transition-opacity',
                      !isEnabled && 'opacity-60',
                    )}
                  >
                    {/* 반복 요일 선택 */}
                    <div className="flex flex-col gap-2">
                      <label className="
                        text-sm font-medium leading-none
                        peer-disabled:cursor-not-allowed
                        peer-disabled:opacity-70
                      "
                      >
                        {t('systemManagement.maintenance.daysOfWeek')}
                      </label>
                      <maintenanceForm.AppField name="recurring.daysOfWeek">
                        {(field) => (
                          <DaySelector
                            days={field.state.value ?? []}
                            disabled={!isEnabled}
                            onChange={(days) => field.handleChange(days)}
                          />
                        )}
                      </maintenanceForm.AppField>
                    </div>

                    {/* 정기 점검 시간 */}
                    <div className="grid grid-cols-2 gap-4">
                      <maintenanceForm.AppField name="recurring.startTime">
                        {(f) => (
                          <f.TimePicker
                            label={t('systemManagement.maintenance.startTime')}
                            disabled={!isEnabled}
                          />
                        )}
                      </maintenanceForm.AppField>

                      <maintenanceForm.AppField name="recurring.endTime">
                        {(f) => (
                          <f.TimePicker
                            label={t('systemManagement.maintenance.endTime')}
                            disabled={!isEnabled}
                          />
                        )}
                      </maintenanceForm.AppField>
                    </div>

                    {/* 정기 점검 안내 문구 */}
                    <maintenanceForm.AppField name="recurring.message">
                      {(field) => (
                        <field.Textarea
                          label={t('systemManagement.maintenance.messageLabel')}
                          placeholder={t('systemManagement.maintenance.recurringMessagePlaceholder')}
                          rows={2}
                          disabled={!isEnabled}
                        />
                      )}
                    </maintenanceForm.AppField>
                  </div>
                );
              }}
            </maintenanceForm.AppField>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </maintenanceForm.AppForm>
  );
});
