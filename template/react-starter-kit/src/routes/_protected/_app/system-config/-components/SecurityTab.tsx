import { Bell, Lock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';

export interface AuthPolicyValue {
  allowRegistration: boolean
  loginFailureThreshold: number
  loginLockDurationMinutes: number
}

export interface SlackNotificationValue {
  webhookUrl: string
}

export interface InquiryPolicyValue {
  unansweredThresholdMinutes: number
}

export type SecurityTabProps = {
  authPolicy?: Partial<AuthPolicyValue>
  slackNotification?: Partial<SlackNotificationValue>
  inquiryPolicy?: Partial<InquiryPolicyValue>
  onSave: (payload: {
    authPolicy: AuthPolicyValue
    slackNotification: SlackNotificationValue
    inquiryPolicy: InquiryPolicyValue
  }) => Promise<void>
};

export function SecurityTab({
  authPolicy,
  slackNotification,
  inquiryPolicy,
  onSave,
}: SecurityTabProps) {
  const secForm = useAppForm({
    defaultValues: {
      allowRegistration: authPolicy?.allowRegistration ?? true,
      loginFailureThreshold: authPolicy?.loginFailureThreshold ?? 5,
      loginLockDurationMinutes: authPolicy?.loginLockDurationMinutes ?? 15,
      slackWebhookUrl: slackNotification?.webhookUrl ?? '',
      unansweredThresholdMinutes: inquiryPolicy?.unansweredThresholdMinutes ?? 10,
    },
    onSubmit: async ({ value }) => {
      await onSave({
        authPolicy: {
          allowRegistration: value.allowRegistration,
          loginFailureThreshold: Number(value.loginFailureThreshold) || 5,
          loginLockDurationMinutes: Number(value.loginLockDurationMinutes) || 15,
        },
        slackNotification: {
          webhookUrl: value.slackWebhookUrl,
        },
        inquiryPolicy: {
          unansweredThresholdMinutes:
            Number(value.unansweredThresholdMinutes) || 10,
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
              회원가입 및 계정 보안 정책
            </CardTitle>
            <CardDescription>
              신규 회원가입 허용 및 로그인 실패에 따른 계정 잠금 정책을
              설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="
              flex items-center justify-between gap-4 rounded-lg border p-4
            "
            >
              <div className="space-y-0.5">
                <span className="text-sm font-medium">신규 회원가입 허용</span>
                <p className="text-xs text-muted-foreground">
                  비활성화 시 일반 사용자의 신규 계정 가입이 전면 차단됩니다.
                </p>
              </div>
              <secForm.AppField name="allowRegistration">
                {(field) => <field.Switch />}
              </secForm.AppField>
            </div>

            <div className="
              grid grid-cols-1
              sm:grid-cols-2
              gap-4
            "
            >
              <secForm.AppField name="loginFailureThreshold">
                {(field) => (
                  <field.Input
                    label="로그인 실패 허용 횟수"
                    type="number"
                    min={3}
                    max={20}
                  />
                )}
              </secForm.AppField>

              <secForm.AppField name="loginLockDurationMinutes">
                {(field) => (
                  <field.Input
                    label="계정 잠금 지속 시간(분)"
                    type="number"
                    min={1}
                    max={1440}
                  />
                )}
              </secForm.AppField>
            </div>
          </CardContent>
        </Card>

        {/* 외부 연동 및 관리자 알림 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              관리자 알림 및 Slack 연동
            </CardTitle>
            <CardDescription>
              고객센터 운영 중 발생하는 긴급 이벤트 알림을 수신할 Slack
              Incoming Webhook을 설정합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <secForm.AppField name="slackWebhookUrl">
              {(field) => (
                <field.Input
                  label="Slack Webhook URL"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                />
              )}
            </secForm.AppField>

            <secForm.AppField name="unansweredThresholdMinutes">
              {(field) => (
                <field.Input
                  label="미응답 문의 감지 기준 시간(분)"
                  type="number"
                  min={1}
                  max={60}
                />
              )}
            </secForm.AppField>
          </CardContent>
        </Card>
      </FormLayout>
    </secForm.AppForm>
  );
}
