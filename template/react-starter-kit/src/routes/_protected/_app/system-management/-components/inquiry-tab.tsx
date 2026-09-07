import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { forwardRef, useImperativeHandle } from 'react';

import { systemConfigControllerTestWebhook } from '#/.generated/api/endpoints/system-config/system-config';
import type { InquiryConfigDto, InquiryNotificationDtoType, TestWebhookRequestDto } from '#/.generated/api/model';
import { Button, Switch } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

export interface InquiryTabHandle {
  submitData: () => Promise<InquiryConfigDto | null>
}

export interface InquiryTabProps {
  inquiry: InquiryConfigDto
}

const WEBHOOK_PLACEHOLDERS: Record<InquiryNotificationDtoType, string> = {
  SLACK: 'https://hooks.slack.com/services/T00.../B00.../...',
  DISCORD: 'https://discord.com/api/webhooks/...',
  CHANNEL_TALK: 'https://api.channel.io/open/v5/groups/.../messages',
  TEAMS: 'https://outlook.office.com/webhook/...',
};

export const InquiryTab = forwardRef<InquiryTabHandle, InquiryTabProps>(function InquiryTab(
  { inquiry }: InquiryTabProps,
  ref,
) {
  const { t } = useI18n();

  const inqForm = useAppForm({
    defaultValues: {
      unansweredThresholdMinutes: inquiry.unansweredThresholdMinutes,
      autoCloseHours: inquiry.autoCloseHours,
      notification: {
        cooldownMinutes: inquiry.notification.cooldownMinutes,
        enabled: inquiry.notification.enabled,
        type: inquiry.notification.type,
        webhookUrl: inquiry.notification.webhookUrl,
      },
    },
  });

  useImperativeHandle(ref, () => ({
    submitData: async () => {
      const isValid = await inqForm.validateAllFields('submit');
      if (!isValid) {
        return null;
      }
      return inqForm.state.values;
    },
  }));

  const testWebhookMutation = useMutation({
    mutationFn: (data: TestWebhookRequestDto) =>
      systemConfigControllerTestWebhook(data),
  });

  const handleTestWebhook = () => {
    const { type, webhookUrl } = inqForm.state.values.notification;
    const url = webhookUrl.trim();
    if (!url) {
      return;
    }
    testWebhookMutation.mutate({
      type,
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
            <inqForm.AppField name="notification.cooldownMinutes">
              {(field) => (
                <field.Input
                  label="재알림 간격"
                  type="number"
                  min={1}
                  max={1440}
                  rightSide="분"
                  showError={false}
                  className="w-36"
                />
              )}
            </inqForm.AppField>
            <inqForm.AppField name="notification.enabled">
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
            <inqForm.AppField name="notification.enabled">
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
                      <inqForm.AppField name="notification.type">
                        {(field) => (
                          <field.Select
                            label={t('systemManagement.inquiry.channelType')}
                            disabled={!isEnabled}
                            showError={false}
                            options={[
                              { label: 'Slack', value: 'SLACK' },
                              { label: 'Discord', value: 'DISCORD' },
                              { label: 'Channel Talk', value: 'CHANNEL_TALK' },
                              { label: 'Microsoft Teams', value: 'TEAMS' },
                            ]}
                          />
                        )}
                      </inqForm.AppField>
                    </div>

                    {/* 2. 웹훅 URL 입력 */}
                    <div className="min-w-0 flex-1">
                      <inqForm.AppField name="notification.type">
                        {(typeField) => {
                          const currentType = typeField.state.value;
                          const placeholder = WEBHOOK_PLACEHOLDERS[currentType] ?? WEBHOOK_PLACEHOLDERS.SLACK;
                          return (
                            <inqForm.AppField name="notification.webhookUrl">
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
});
