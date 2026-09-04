import type { AuthPolicyValueDto, InquiryPolicyValueDto, SlackNotificationValueDto } from '#/.generated/api/model';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

export interface SecurityTabProps {
  authPolicy?: Partial<AuthPolicyValueDto>
  slackNotification?: Partial<SlackNotificationValueDto>
  inquiryPolicy?: Partial<InquiryPolicyValueDto>
  onSave: (payload: {
    authPolicy: AuthPolicyValueDto
    slackNotification: SlackNotificationValueDto
    inquiryPolicy: InquiryPolicyValueDto
  }) => Promise<void>
}

export function SecurityTab({
  authPolicy,
  slackNotification,
  inquiryPolicy,
  onSave,
}: SecurityTabProps) {
  const { t } = useI18n();

  const secForm = useAppForm({
    defaultValues: {
      allowRegistration: authPolicy?.allowRegistration ?? true,
      loginFailureThreshold: authPolicy?.loginFailureThreshold ?? 5,
      loginLockDurationMinutes: authPolicy?.loginLockDurationMinutes ?? 15,
      passwordExpirationDays: authPolicy?.passwordExpirationDays ?? 90,
      slackWebhookUrl: slackNotification?.webhookUrl ?? '',
      unansweredThresholdMinutes: inquiryPolicy?.unansweredThresholdMinutes ?? 10,
      autoCloseHours: inquiryPolicy?.autoCloseHours ?? 72,
    },
    onSubmit: async ({ value }) => {
      await onSave({
        authPolicy: {
          allowRegistration: value.allowRegistration,
          loginFailureThreshold: Number(value.loginFailureThreshold) || 5,
          loginLockDurationMinutes: Number(value.loginLockDurationMinutes) || 15,
          passwordExpirationDays: Number(value.passwordExpirationDays) || 0,
        },
        slackNotification: {
          webhookUrl: value.slackWebhookUrl,
        },
        inquiryPolicy: {
          unansweredThresholdMinutes: Number(value.unansweredThresholdMinutes) || 10,
          autoCloseHours: Number(value.autoCloseHours) || 72,
        },
      });
    },
  });

  return (
    <secForm.AppForm>
      <FormLayout
        id="security-form"
        onSubmit={() => void secForm.handleSubmit()}
        className="flex flex-col"
      >
        {/* 회원가입 및 계정 보안 정책 */}
        <SectionCard variant="ghost" textSize="base" icon="lock" title={t('systemConfig.security.authTitle')} description={t('systemConfig.security.authDescription')}>
          <SectionCard.Content className="flex flex-col">
            <div className="
              flex justify-end
              *:data-[slot=field]:w-fit
            "
            >
              <secForm.AppField name="allowRegistration">
                {(field) => (
                  <field.Switch
                    orientation="horizontal"
                    showError={false}
                    label={t('systemConfig.security.allowRegistration')}
                  />
                )}
              </secForm.AppField>
            </div>
            <div className="grid grid-cols-3 gap-4">

              <secForm.AppField name="loginFailureThreshold">
                {(field) => (
                  <field.Input
                    label={t('systemConfig.security.loginFailureThreshold')}
                    type="number"
                    min={3}
                    max={20}
                  />
                )}
              </secForm.AppField>

              <secForm.AppField name="loginLockDurationMinutes">
                {(field) => (
                  <field.Input
                    label={t('systemConfig.security.loginLockDuration')}
                    type="number"
                    min={1}
                    max={1440}
                  />
                )}
              </secForm.AppField>

              <secForm.AppField name="passwordExpirationDays">
                {(field) => (
                  <field.Input
                    label={t('systemConfig.security.passwordExpiration')}
                    type="number"
                    min={0}
                    max={365}
                  />
                )}
              </secForm.AppField>
            </div>
          </SectionCard.Content>
        </SectionCard>

        {/* 1:1 문의 운영 및 알림 정책 */}
        <SectionCard variant="ghost" textSize="base" icon="clock" title={t('systemConfig.security.inquiryTitle')} description={t('systemConfig.security.inquiryDescription')}>
          <SectionCard.Content className="grid grid-cols-2 gap-4">
            <secForm.AppField name="unansweredThresholdMinutes">
              {(field) => (
                <field.Input
                  label={t('systemConfig.security.unansweredThreshold')}
                  type="number"
                  min={1}
                  max={120}
                />
              )}
            </secForm.AppField>

            <secForm.AppField name="autoCloseHours">
              {(field) => (
                <field.Input
                  label={t('systemConfig.security.autoCloseHours')}
                  type="number"
                  min={1}
                  max={720}
                />
              )}
            </secForm.AppField>
          </SectionCard.Content>
        </SectionCard>

        {/* 외부 연동 및 관리자 알림 */}
        <SectionCard variant="ghost" textSize="base" icon="bell" title={t('systemConfig.security.slackTitle')} description={t('systemConfig.security.slackDescription')}>
          <SectionCard.Content className="flex flex-col">
            <secForm.AppField name="slackWebhookUrl">
              {(field) => (
                <field.Input
                  label={t('systemConfig.security.slackWebhookUrl')}
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                />
              )}
            </secForm.AppField>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </secForm.AppForm>
  );
}
