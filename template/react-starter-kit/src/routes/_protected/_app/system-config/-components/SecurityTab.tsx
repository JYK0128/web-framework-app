import { useI18n } from '@pkg/shared/web';
import { Bell, Clock, Lock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';

export interface AuthPolicyValue {
  allowRegistration: boolean
  loginFailureThreshold: number
  loginLockDurationMinutes: number
  passwordExpirationDays: number
}

export interface SlackNotificationValue {
  webhookUrl: string
}

export interface InquiryPolicyValue {
  unansweredThresholdMinutes: number
  autoCloseHours: number
}

export interface SecurityTabProps {
  authPolicy?: Partial<AuthPolicyValue>
  slackNotification?: Partial<SlackNotificationValue>
  inquiryPolicy?: Partial<InquiryPolicyValue>
  onSave: (payload: {
    authPolicy: AuthPolicyValue
    slackNotification: SlackNotificationValue
    inquiryPolicy: InquiryPolicyValue
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
        className="flex flex-col gap-6"
      >
        {/* 회원가입 및 계정 보안 정책 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-5 text-primary" />
              {t('systemConfig.security.authTitle')}
            </CardTitle>
            <CardDescription>
              {t('systemConfig.security.authDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <secForm.AppField name="allowRegistration">
              {(field) => (
                <field.Switch
                  orientation="horizontal"
                  showError={false}
                  label={t('systemConfig.security.allowRegistration')}
                />
              )}
            </secForm.AppField>

            <div className="
              grid grid-cols-1 gap-4
              sm:grid-cols-3
            "
            >

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
          </CardContent>
        </Card>

        {/* 1:1 문의 운영 및 알림 정책 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              {t('systemConfig.security.inquiryTitle')}
            </CardTitle>
            <CardDescription>
              {t('systemConfig.security.inquiryDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="
            grid grid-cols-1 gap-4
            sm:grid-cols-2
          "
          >
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
          </CardContent>
        </Card>

        {/* 외부 연동 및 관리자 알림 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              {t('systemConfig.security.slackTitle')}
            </CardTitle>
            <CardDescription>
              {t('systemConfig.security.slackDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <secForm.AppField name="slackWebhookUrl">
              {(field) => (
                <field.Input
                  label={t('systemConfig.security.slackWebhookUrl')}
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                />
              )}
            </secForm.AppField>
          </CardContent>
        </Card>
      </FormLayout>
    </secForm.AppForm>
  );
}
