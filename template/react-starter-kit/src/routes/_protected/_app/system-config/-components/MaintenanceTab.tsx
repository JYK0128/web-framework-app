import { ShieldAlert, Wrench } from 'lucide-react';

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle, Label, NativeSelect, NativeSelectOption } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormLayout, useAppForm } from '#/components/form';

const DAYS_OF_WEEK = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 0, label: '일' },
];

export interface EmergencyMaintenanceValue {
  enabled: boolean
  message: string
}

export interface ScheduledMaintenanceValue {
  enabled: boolean
  recurringDay: number | null
  start: string
  end: string
  scheduledStartAt: string | null
  scheduledEndAt: string | null
}

export type MaintenanceTabProps = {
  emergency?: Partial<EmergencyMaintenanceValue>
  scheduled?: Partial<ScheduledMaintenanceValue>
  onSave: (payload: {
    emergency: EmergencyMaintenanceValue
    scheduled: ScheduledMaintenanceValue
  }) => Promise<void>
};

export function MaintenanceTab({ emergency, scheduled, onSave }: MaintenanceTabProps) {
  const maintForm = useAppForm({
    defaultValues: {
      emergencyEnabled: Boolean(emergency?.enabled),
      emergencyMessage: emergency?.message ?? '시스템 점검 중입니다.',
      scheduledEnabled: Boolean(scheduled?.enabled),
      scheduledRecurringDay: scheduled?.recurringDay ?? null,
      scheduledStart: scheduled?.start ?? '02:00',
      scheduledEnd: scheduled?.end ?? '06:00',
    },
    onSubmit: async ({ value }) => {
      await onSave({
        emergency: {
          enabled: value.emergencyEnabled,
          message: value.emergencyMessage,
        },
        scheduled: {
          enabled: value.scheduledEnabled,
          recurringDay:
            value.scheduledRecurringDay === null
              ? null
              : Number(value.scheduledRecurringDay),
          start: value.scheduledStart,
          end: value.scheduledEnd,
          scheduledStartAt: scheduled?.scheduledStartAt ?? null,
          scheduledEndAt: scheduled?.scheduledEndAt ?? null,
        },
      });
    },
  });

  return (
    <maintForm.AppForm>
      <FormLayout
        id="maintenance-form"
        onSubmit={() => void maintForm.handleSubmit()}
        className="flex flex-col gap-6"
      >
        {/* 긴급 점검 모드 */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5" />
              긴급 시스템 점검 모드
            </CardTitle>
            <CardDescription>
              활성화 시 모든 일반 사용자의 서비스 접근이 즉시 차단되고 점검
              안내 화면이 표시됩니다.
            </CardDescription>
            <CardAction>
              <maintForm.AppField name="emergencyEnabled">
                {(field) => <field.Switch />}
              </maintForm.AppField>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <maintForm.AppField name="emergencyEnabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <div className={cn('transition-opacity', !isEnabled && `
                    opacity-60
                  `)}
                  >
                    <maintForm.AppField name="emergencyMessage">
                      {(field) => (
                        <field.Textarea
                          label="긴급 점검 안내 문구"
                          placeholder="예: 긴급 데이터베이스 점검으로 인해 일시적으로 서비스를 중단합니다."
                          rows={2}
                          disabled={!isEnabled}
                        />
                      )}
                    </maintForm.AppField>
                  </div>
                );
              }}
            </maintForm.AppField>
          </CardContent>
        </Card>

        {/* 정기 / 예약 점검 스케줄 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="size-5 text-primary" />
              정기 및 예약 시스템 점검
            </CardTitle>
            <CardDescription>
              특정 요일 또는 지정 시간대에 반복 실행되는 정기 점검 스케줄을
              설정합니다.
            </CardDescription>
            <CardAction>
              <maintForm.AppField name="scheduledEnabled">
                {(field) => <field.Switch />}
              </maintForm.AppField>
            </CardAction>
          </CardHeader>
          <CardContent>
            <maintForm.AppField name="scheduledEnabled">
              {(field) => {
                const enabled = field.state.value;
                return (
                  <div className={cn(`
                    flex flex-col gap-4 pt-2 transition-opacity
                  `, !enabled && `opacity-60`)}
                  >
                    <div className="
                      grid grid-cols-1
                      sm:grid-cols-3
                      gap-4
                    "
                    >
                      <div className="space-y-2">
                        <Label
                          htmlFor="maint-recurring-day"
                          className="text-sm font-medium"
                        >
                          반복 점검 요일
                        </Label>
                        <maintForm.AppField name="scheduledRecurringDay">
                          {(f) => (
                            <NativeSelect
                              id="maint-recurring-day"
                              disabled={!enabled}
                              value={
                                f.state.value === null
                                  ? 'none'
                                  : String(f.state.value)
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                f.handleChange(
                                  val === 'none' ? null : Number(val),
                                );
                              }}
                              className="h-9"
                            >
                              <NativeSelectOption value="none">
                                미지정 (일회성 점검)
                              </NativeSelectOption>
                              {DAYS_OF_WEEK.map((d) => (
                                <NativeSelectOption
                                  key={d.value}
                                  value={String(d.value)}
                                >
                                  매주
                                  {' '}
                                  {d.label}
                                  요일
                                </NativeSelectOption>
                              ))}
                            </NativeSelect>
                          )}
                        </maintForm.AppField>
                      </div>

                      <maintForm.AppField name="scheduledStart">
                        {(f) => (
                          <f.Input
                            label="점검 시작 시간"
                            type="time"
                            disabled={!enabled}
                          />
                        )}
                      </maintForm.AppField>

                      <maintForm.AppField name="scheduledEnd">
                        {(f) => (
                          <f.Input
                            label="점검 종료 시간"
                            type="time"
                            disabled={!enabled}
                          />
                        )}
                      </maintForm.AppField>
                    </div>
                  </div>
                );
              }}
            </maintForm.AppField>
          </CardContent>
        </Card>
      </FormLayout>
    </maintForm.AppForm>
  );
}
