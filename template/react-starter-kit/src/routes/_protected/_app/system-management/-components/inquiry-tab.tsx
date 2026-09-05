import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

import { systemConfigControllerTestWebhook } from '#/.generated/api/endpoints/system-config/system-config';
import type { InquiryConfigDto, InquiryNotificationDtoType, TestWebhookRequestDto, TestWebhookResponseDto } from '#/.generated/api/model';
import { Button, Switch } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

export interface InquiryTabProps {
  inquiry?: Partial<InquiryConfigDto>
  onSave: (inquiry: InquiryConfigDto) => Promise<void>
}

const WEBHOOK_PLACEHOLDERS: Record<InquiryNotificationDtoType, string> = {
  SLACK: 'https://hooks.slack.com/services/T00.../B00.../...',
  DISCORD: 'https://discord.com/api/webhooks/...',
  WEBHOOK: 'https://api.example.com/webhook',
};

export function InquiryTab({ inquiry, onSave }: InquiryTabProps) {
  const { t } = useI18n();

  const inqForm = useAppForm({
    defaultValues: {
      unansweredThresholdMinutes: inquiry?.unansweredThresholdMinutes ?? 10,
      autoCloseHours: inquiry?.autoCloseHours ?? 72,
      enabled: inquiry?.notification?.enabled ?? false,
      channelType: (inquiry?.notification?.type ?? 'SLACK'),
      webhookUrl: inquiry?.notification?.webhookUrl ?? '',
    },
    onSubmit: async ({ value }) => {
      await onSave({
        unansweredThresholdMinutes: Number(value.unansweredThresholdMinutes) || 10,
        autoCloseHours: Number(value.autoCloseHours) || 72,
        notification: {
          enabled: value.enabled,
          type: value.channelType,
          webhookUrl: value.webhookUrl.trim(),
        },
      });
    },
  });

  const testWebhookMutation = useMutation({
    mutationFn: (data: TestWebhookRequestDto) =>
      systemConfigControllerTestWebhook(data),
    onSuccess: (res: TestWebhookResponseDto) => {
      if (res.success) {
        toast.success(t('systemManagement.inquiry.testWebhookSuccess'));
      }
      else {
        const errorMsg = res.message || t('systemManagement.inquiry.testWebhookFailed');
        toast.error(errorMsg);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || t('systemManagement.inquiry.testWebhookFailed'));
    },
  });

  const handleTestWebhook = () => {
    const url = inqForm.state.values.webhookUrl.trim();
    if (!url) {
      toast.error(t('systemManagement.inquiry.webhookUrlRequired'));
      return;
    }
    testWebhookMutation.mutate({
      type: inqForm.state.values.channelType,
      webhookUrl: url,
    });
  };

  return (
    <inqForm.AppForm>
      <FormLayout
        id="inquiry-form"
        onSubmit={() => void inqForm.handleSubmit()}
        className="flex flex-col gap-6"
      >
        {/* 1. 1:1 문의 처리 정책 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="clock"
          title={t('systemManagement.inquiry.policyTitle')}
          description={t('systemManagement.inquiry.policyDescription')}
        >
          <SectionCard.Content>
            <div className="
              grid grid-cols-1 gap-6
              md:grid-cols-2
            "
            >
              <inqForm.AppField name="unansweredThresholdMinutes">
                {(field) => (
                  <field.Input
                    type="number"
                    min={1}
                    max={120}
                    label={t('systemManagement.inquiry.unansweredThreshold')}
                    rightSide="분"
                  />
                )}
              </inqForm.AppField>

              <inqForm.AppField name="autoCloseHours">
                {(field) => (
                  <field.Input
                    type="number"
                    min={1}
                    max={720}
                    label={t('systemManagement.inquiry.autoClose')}
                    rightSide="시간"
                  />
                )}
              </inqForm.AppField>
            </div>
          </SectionCard.Content>
        </SectionCard>

        {/* 2. 문의 관리자 알림 연동 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="bell"
          title={t('systemManagement.inquiry.notificationTitle')}
          description={t('systemManagement.inquiry.notificationDescription')}
        >
          <SectionCard.Actions>
            <inqForm.AppField name="enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label={t('systemManagement.inquiry.notificationEnabled')}
                />
              )}
            </inqForm.AppField>
          </SectionCard.Actions>

          <SectionCard.Content>
            <inqForm.AppField name="enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <div className="
                    flex flex-col gap-3
                    sm:flex-row sm:items-end
                  "
                  >
                    {/* 1. 채널 종류 선택 */}
                    <div className="shrink-0">
                      <inqForm.AppField name="channelType">
                        {(field) => (
                          <field.Select
                            label={t('systemManagement.inquiry.channelType')}
                            disabled={!isEnabled}
                            showError={false}
                            options={[
                              { label: 'Slack', value: 'SLACK' },
                              { label: 'Discord', value: 'DISCORD' },
                              { label: 'Custom Webhook', value: 'WEBHOOK' },
                            ]}
                          />
                        )}
                      </inqForm.AppField>
                    </div>

                    {/* 2. 웹훅 URL 입력 */}
                    <div className="min-w-0 flex-1">
                      <inqForm.AppField name="channelType">
                        {(typeField) => {
                          const currentType = typeField.state.value ?? 'SLACK';
                          const placeholder = WEBHOOK_PLACEHOLDERS[currentType] ?? WEBHOOK_PLACEHOLDERS.SLACK;
                          return (
                            <inqForm.AppField name="webhookUrl">
                              {(urlField) => (
                                <urlField.Input
                                  label={t('systemManagement.inquiry.webhookUrl')}
                                  placeholder={placeholder}
                                  disabled={!isEnabled}
                                  showError={false}
                                />
                              )}
                            </inqForm.AppField>
                          );
                        }}
                      </inqForm.AppField>
                    </div>

                    {/* 3. 테스트 발송 버튼 */}
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      className="shrink-0"
                      disabled={!isEnabled || testWebhookMutation.isPending}
                      onClick={handleTestWebhook}
                    >
                      <Send className="mr-1.5 size-4" />
                      {testWebhookMutation.isPending
                        ? t('systemManagement.inquiry.testingWebhook')
                        : t('systemManagement.inquiry.testWebhook')}
                    </Button>
                  </div>
                );
              }}
            </inqForm.AppField>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </inqForm.AppForm>
  );
}
