import { useI18n } from '@pkg/shared/web';
import { Wrench } from 'lucide-react';

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { cn } from '#/.generated/shadcn/lib/utils';
import { FormLayout, useAppForm } from '#/components/form';

export interface EmergencyMaintenanceValue {
  enabled: boolean
  message: string
}

export interface ScheduledMaintenanceValue {
  enabled: boolean
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

function toDateTimeLocal(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIsoString(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function MaintenanceTab({ emergency, scheduled, onSave }: MaintenanceTabProps) {
  const { t } = useI18n();

  const isInitiallyEnabled = Boolean(emergency?.enabled || scheduled?.enabled);
  const initialMessage = emergency?.message || '시스템 점검 중입니다.';

  const maintForm = useAppForm({
    defaultValues: {
      enabled: isInitiallyEnabled,
      message: initialMessage,
      scheduledStartAt: toDateTimeLocal(scheduled?.scheduledStartAt),
      scheduledEndAt: toDateTimeLocal(scheduled?.scheduledEndAt),
    },
    onSubmit: async ({ value }) => {
      const isEnabled = value.enabled;
      const startAt = toIsoString(value.scheduledStartAt);
      const endAt = toIsoString(value.scheduledEndAt);
      const isScheduled = Boolean(startAt && endAt);

      await onSave({
        emergency: {
          enabled: isEnabled && !isScheduled,
          message: value.message,
        },
        scheduled: {
          enabled: isEnabled,
          scheduledStartAt: startAt,
          scheduledEndAt: endAt,
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="size-5 text-primary" />
              {t('systemConfig.maintenance.title')}
            </CardTitle>
            <CardDescription>
              {t('systemConfig.maintenance.description')}
            </CardDescription>
            <CardAction>
              <maintForm.AppField name="enabled">
                {(field) => <field.Switch />}
              </maintForm.AppField>
            </CardAction>
          </CardHeader>
          <CardContent>
            <maintForm.AppField name="enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <div
                    className={cn(
                      'flex flex-col gap-6 transition-opacity',
                      !isEnabled && 'opacity-60',
                    )}
                  >
                    {/* 점검 안내 문구 */}
                    <maintForm.AppField name="message">
                      {(field) => (
                        <field.Textarea
                          label={t('systemConfig.maintenance.messageLabel')}
                          placeholder={t('systemConfig.maintenance.messagePlaceholder')}
                          rows={2}
                          disabled={!isEnabled}
                        />
                      )}
                    </maintForm.AppField>

                    {/* 점검 일정 (선택) */}
                    <div className="
                      grid grid-cols-1 gap-4
                      sm:grid-cols-2
                    "
                    >
                      <maintForm.AppField name="scheduledStartAt">
                        {(f) => (
                          <f.DateTimePicker
                            label={t('systemConfig.maintenance.scheduledStartAt')}
                            placeholder={t('systemConfig.maintenance.scheduledStartAt')}
                            disabled={!isEnabled}
                          />
                        )}
                      </maintForm.AppField>

                      <maintForm.AppField name="scheduledEndAt">
                        {(f) => (
                          <f.DateTimePicker
                            label={t('systemConfig.maintenance.scheduledEndAt')}
                            placeholder={t('systemConfig.maintenance.scheduledEndAt')}
                            disabled={!isEnabled}
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
