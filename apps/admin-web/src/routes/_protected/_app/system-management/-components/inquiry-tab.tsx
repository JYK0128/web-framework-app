import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { forwardRef, useImperativeHandle } from 'react';

import { systemConfigControllerTestWebhookV1 } from '#/.generated/api/endpoints/system-config/system-config';
import type { InquiryConfigDto, InquiryNotificationDtoType, TestWebhookRequestDto } from '#/.generated/api/model';
import { Button, Switch } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';

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
      systemConfigControllerTestWebhookV1(data),
  });

  const handleTestWebhook = () => {
    const { type, webhookUrl } = inqForm.state.values.notification;
    const url = webhookUrl.trim();
    if (!url) {
      return;
    }
    const payload: TestWebhookRequestDto = {
      type,
      webhookUrl: url,
    };
    testWebhookMutation.mutate(payload);
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
          title={"1:1 문의 운영 정책"}
          description={"미응답 문의 감지 기준 및 답변 완료 후 자동 종료 기준 시간을 설정합니다."}
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
                    label={"미응답 감지 기준 시간"}
                    placeholder="미응답 기준 시간을 입력해 주세요."
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
                    label={"자동 종료 기준 시간"}
                    placeholder="자동 종료 시간을 입력해 주세요."
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
          title={"문의 관리자 알림 연동"}
          description={"신규 문의 등록 또는 미응답 문의 발생 시 관리자 알림을 수신할 채널 및 웹훅을 설정합니다."}
        >
          <SectionCard.Actions>
            <inqForm.AppField name="notification.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label={"관리자 알림 활성화"}
                />
              )}
            </inqForm.AppField>
          </SectionCard.Actions>

          <SectionCard.Content>
            <inqForm.AppField name="notification.enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <div className="flex flex-col gap-4">
                    {/* 1줄: 채널 종류, 재알림 간격 */}
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <inqForm.AppField name="notification.type">
                          {(field) => (
                            <field.Select
                              label={"알림 채널 종류"}
                              placeholder="알림 채널을 선택해 주세요"
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

                      <div className="flex-1 min-w-[200px]">
                        <inqForm.AppField name="notification.cooldownMinutes">
                          {(field) => (
                            <field.Input
                              label={"재알림 간격"}
                              placeholder="재알림 간격을 입력해 주세요."
                              type="number"
                              min={1}
                              max={1440}
                              rightSide="분"
                              disabled={!isEnabled}
                              showError={false}
                            />
                          )}
                        </inqForm.AppField>
                      </div>
                    </div>

                    {/* 2줄: 웹훅 URL, 테스트 발송 버튼 */}
                    <div className="
                      flex flex-col gap-3
                      sm:flex-row sm:items-end
                    "
                    >
                      <div className="flex-1">
                        <inqForm.AppField name="notification.type">
                          {(typeField) => {
                            const currentType = typeField.state.value;
                            const placeholder = WEBHOOK_PLACEHOLDERS[currentType] ?? WEBHOOK_PLACEHOLDERS.SLACK;
                            return (
                              <inqForm.AppField name="notification.webhookUrl">
                                {(urlField) => (
                                  <urlField.Input
                                    label={"웹훅 수신 URL"}
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
                          ? "발송 중..."
                          : "테스트 발송"}
                      </Button>
                    </div>
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
