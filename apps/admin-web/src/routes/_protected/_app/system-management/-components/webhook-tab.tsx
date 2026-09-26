import { useMutation } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { forwardRef, useImperativeHandle } from 'react';

import { systemConfigControllerTestWebhookV1 } from '#/.generated/api/endpoints/system-configs/system-configs';
import type { TestWebhookRequestDto, WebhookConfigDto, WebhookConfigDtoType } from '#/.generated/api/model';
import { Button, Switch } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';

export interface WebhookTabHandle {
  submitData: () => Promise<WebhookConfigDto | null>
}

export interface WebhookTabProps {
  webhook: WebhookConfigDto
}

const WEBHOOK_PLACEHOLDERS: Record<WebhookConfigDtoType, string> = {
  SLACK: 'https://hooks.slack.com/services/T00.../B00.../...',
  DISCORD: 'https://discord.com/api/webhooks/...',
  CHANNEL_TALK: 'https://api.channel.io/open/v5/groups/.../messages',
  TEAMS: 'https://outlook.office.com/webhook/...',
};

export const WebhookTab = forwardRef<WebhookTabHandle, WebhookTabProps>(function WebhookTab(
  { webhook }: WebhookTabProps,
  ref,
) {
  const webhookForm = useAppForm({
    defaultValues: {
      enabled: webhook.enabled,
      type: webhook.type,
      cooldownMinutes: webhook.cooldownMinutes,
      webhookUrl: webhook.webhookUrl,
    },
  });

  useImperativeHandle(ref, () => ({
    submitData: async () => {
      const isValid = await webhookForm.validateAllFields('submit');
      if (!isValid) return null;
      return webhookForm.state.values;
    },
  }));

  const testWebhookMutation = useMutation({
    mutationFn: (data: TestWebhookRequestDto) => systemConfigControllerTestWebhookV1(data),
  });

  const handleTestWebhook = () => {
    const { type, webhookUrl } = webhookForm.state.values;
    const url = webhookUrl.trim();
    if (!url) return;
    testWebhookMutation.mutate({ type, webhookUrl: url });
  };

  return (
    <webhookForm.AppForm>
      <FormLayout
        id="webhook-form"
        onSubmit={() => void webhookForm.handleSubmit()}
        className="flex flex-col gap-6"
      >
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="bell"
          title="문의 운영자 웹훅"
          description="새 문의와 미응답 문의 알림을 받을 웹훅을 설정합니다."
        >
          <SectionCard.Actions>
            <webhookForm.AppField name="enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label="문의 웹훅 활성화"
                />
              )}
            </webhookForm.AppField>
          </SectionCard.Actions>
          <SectionCard.Content>
            <webhookForm.AppField name="enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-4">
                      <div className="min-w-[200px] flex-1">
                        <webhookForm.AppField name="type">
                          {(field) => (
                            <field.Select
                              label="웹훅 채널 종류"
                              placeholder="웹훅 채널을 선택해 주세요"
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
                        </webhookForm.AppField>
                      </div>
                      <div className="min-w-[200px] flex-1">
                        <webhookForm.AppField name="cooldownMinutes">
                          {(field) => (
                            <field.Input
                              label="재알림 간격"
                              placeholder="재알림 간격을 입력해 주세요."
                              type="number"
                              min={1}
                              max={1440}
                              rightSide="분"
                              disabled={!isEnabled}
                              showError={false}
                            />
                          )}
                        </webhookForm.AppField>
                      </div>
                    </div>
                    <div className="
                      flex flex-col gap-3
                      sm:flex-row sm:items-end
                    "
                    >
                      <webhookForm.AppField name="type">
                        {(typeField) => {
                          const placeholder = WEBHOOK_PLACEHOLDERS[typeField.state.value] ?? WEBHOOK_PLACEHOLDERS.SLACK;
                          return (
                            <webhookForm.AppField name="webhookUrl">
                              {(urlField) => (
                                <urlField.Input
                                  label="웹훅 수신 URL"
                                  placeholder={placeholder}
                                  disabled={!isEnabled}
                                  showError={false}
                                />
                              )}
                            </webhookForm.AppField>
                          );
                        }}
                      </webhookForm.AppField>
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        className="shrink-0"
                        disabled={!isEnabled || testWebhookMutation.isPending}
                        onClick={handleTestWebhook}
                      >
                        <Send className="mr-1.5 size-4" />
                        {testWebhookMutation.isPending ? '발송 중...' : '테스트 발송'}
                      </Button>
                    </div>
                  </div>
                );
              }}
            </webhookForm.AppField>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </webhookForm.AppForm>
  );
});
