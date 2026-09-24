import { forwardRef, useImperativeHandle } from 'react';

import type { MaintenanceConfigDto } from '#/.generated/api/model';
import { Button, Switch } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
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

  const maintenanceForm = useAppForm({
    defaultValues: {
      temporary: {
        enabled: maintenance?.temporary?.enabled ?? false,
        message: maintenance?.temporary?.message ?? '',
        startAt: maintenance?.temporary?.startAt ?? null,
        endAt: maintenance?.temporary?.endAt ?? null,
      },
      recurring: {
        enabled: maintenance?.recurring?.enabled ?? false,
        message: maintenance?.recurring?.message ?? '',
        daysOfWeek: maintenance?.recurring?.daysOfWeek ?? [],
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
      return maintenanceForm.state.values;
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
          title={"임시 점검"}
          description={"특정 기간 동안 또는 즉시 진행되는 점검을 설정합니다."}
        >
          <SectionCard.Actions>
            <maintenanceForm.AppField name="temporary.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label={"임시 점검"}
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
                          <f.DatetimePicker
                            label={"점검 시작 일시"}
                            placeholder={"점검 시작 일시"}
                            disabled={!isEnabled}
                          />
                        )}
                      </maintenanceForm.AppField>

                      <maintenanceForm.AppField name="temporary.endAt">
                        {(f) => (
                          <f.DatetimePicker
                            label={"점검 종료 일시"}
                            placeholder={"점검 종료 일시"}
                            disabled={!isEnabled}
                          />
                        )}
                      </maintenanceForm.AppField>
                    </div>

                    {/* 임시 점검 안내 문구 */}
                    <maintenanceForm.AppField name="temporary.message">
                      {(field) => (
                        <field.Textarea
                          label={"점검 안내 문구"}
                          placeholder={"예: 현재 시스템 점검 중입니다. 점검 완료 후 정상 이용 가능합니다."}
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
          title={"정기 점검"}
          description={"매주 정기적으로 실행되는 점검 일정을 설정합니다."}
        >
          <SectionCard.Actions>
            <maintenanceForm.AppField name="recurring.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label={"정기 점검"}
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
                        {"반복 요일"}
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
                            label={"점검 시작 시각"}
                            placeholder="점검 시작 시각을 선택해 주세요"
                            disabled={!isEnabled}
                          />
                        )}
                      </maintenanceForm.AppField>

                      <maintenanceForm.AppField name="recurring.endTime">
                        {(f) => (
                          <f.TimePicker
                            label={"점검 종료 시각"}
                            placeholder="점검 종료 시각을 선택해 주세요"
                            disabled={!isEnabled}
                          />
                        )}
                      </maintenanceForm.AppField>
                    </div>

                    {/* 정기 점검 안내 문구 */}
                    <maintenanceForm.AppField name="recurring.message">
                      {(field) => (
                        <field.Textarea
                          label={"점검 안내 문구"}
                          placeholder={"예: 정기 시스템 점검 시간입니다. 점검 시간 동안 서비스 이용이 일시 중단됩니다."}
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
