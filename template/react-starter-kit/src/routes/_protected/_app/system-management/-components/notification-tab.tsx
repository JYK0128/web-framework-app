import { Send } from 'lucide-react';
import { forwardRef, useImperativeHandle, useMemo } from 'react';

import { useSystemConfigControllerTestEmail, useSystemConfigControllerTestMessenger, useSystemConfigControllerTestPush, useSystemConfigControllerTestSms } from '#/.generated/api/endpoints/system-config/system-config';
import { type KakaoMessengerDetailsDtoAgency, type MessengerConfigDtoProvider, type NotificationConfigDto, type PushConfigDtoProvider, type SmsConfigDtoProvider } from '#/.generated/api/model';
import { Button, Field, FieldLabel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';
import { useI18n } from '#/hooks';

export interface NotificationTabHandle {
  submitData: () => Promise<NotificationConfigDto | null>
}

export interface NotificationTabProps {
  notification?: Partial<NotificationConfigDto>
}

type NotiFormFieldName
  = | 'email.smtp.host' | 'email.smtp.port' | 'email.smtp.secure' | 'email.smtp.user' | 'email.smtp.pass'
    | 'messenger.kakao.plusFriendId' | 'messenger.kakao.senderKey'
    | 'messenger.kakao.nhn.appKey' | 'messenger.kakao.nhn.secretKey'
    | 'messenger.kakao.solapi.apiKey' | 'messenger.kakao.solapi.apiSecret'
    | 'messenger.kakao.aligo.userId' | 'messenger.kakao.aligo.apiKey'
    | 'messenger.line.channelId' | 'messenger.line.channelSecret' | 'messenger.line.accessToken'
    | 'messenger.whatsapp.phoneNumberId' | 'messenger.whatsapp.businessAccountId' | 'messenger.whatsapp.accessToken'
    | 'messenger.telegram.botToken' | 'messenger.telegram.chatId'
    | 'messenger.wechat.appId' | 'messenger.wechat.appSecret'
    | 'sms.nhn.appKey' | 'sms.nhn.secretKey' | 'sms.nhn.senderPhone'
    | 'sms.solapi.apiKey' | 'sms.solapi.apiSecret' | 'sms.solapi.senderPhone'
    | 'sms.aligo.userId' | 'sms.aligo.apiKey' | 'sms.aligo.sender'
    | 'push.fcm.projectId' | 'push.fcm.apiKey'
    | 'push.nhn.appKey' | 'push.nhn.secretKey'
    | 'push.sns.region' | 'push.sns.platformApplicationArn' | 'push.sns.accessKeyId' | 'push.sns.secretAccessKey'
    | 'push.oracle.region' | 'push.oracle.compartmentId' | 'push.oracle.topicId';

interface FieldSchema {
  name: NotiFormFieldName
  label: string
  placeholder?: string
  type?: 'text' | 'password' | 'number' | 'textarea' | 'switch'
  colSpan?: number
  className?: string
}

interface ProviderFieldGroup {
  cols: number
  fields: Array<FieldSchema>
}

function getGridColsClass(cols: number): string {
  switch (cols) {
    case 6: {
      return 'sm:grid-cols-6';
    }
    case 3: {
      return 'sm:grid-cols-3';
    }
    default: {
      return 'sm:grid-cols-2';
    }
  }
}

function getColSpanClass(colSpan?: number): string {
  switch (colSpan) {
    case 2: {
      return 'sm:col-span-2';
    }
    case 3: {
      return 'sm:col-span-3';
    }
    case 6: {
      return 'sm:col-span-6';
    }
    default: {
      return '';
    }
  }
}

function extractRecipientEmail(from: string): string {
  const start = from.indexOf('<');
  const end = from.indexOf('>', start + 1);
  if (start !== -1 && end !== -1) {
    return from.slice(start + 1, end).trim();
  }
  return from.trim();
}

function getSmsSenderFieldName(provider: SmsConfigDtoProvider): NotiFormFieldName {
  if (provider === 'ALIGO_SMS') return 'sms.aligo.sender';
  if (provider === 'SOLAPI_SMS') return 'sms.solapi.senderPhone';
  return 'sms.nhn.senderPhone';
}

export const NotificationTab = forwardRef<NotificationTabHandle, NotificationTabProps>(function NotificationTab(
  { notification }: NotificationTabProps,
  ref,
) {
  const { t } = useI18n();

  const emailSmtpGroup: ProviderFieldGroup = useMemo(() => ({
    cols: 6,
    fields: [
      { name: 'email.smtp.host', label: t('systemManagement.notification.smtpHost'), placeholder: 'smtp.gmail.com / email-smtp.amazonaws.com', colSpan: 2 },
      { name: 'email.smtp.port', label: t('systemManagement.notification.smtpPort'), placeholder: '587', type: 'number', colSpan: 2 },
      { name: 'email.smtp.secure', label: t('systemManagement.notification.smtpSecure'), type: 'switch', colSpan: 2 },
      { name: 'email.smtp.user', label: t('systemManagement.notification.smtpUser'), placeholder: 'user@example.com / SMTP Username', colSpan: 3 },
      { name: 'email.smtp.pass', label: t('systemManagement.notification.smtpPass'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password', colSpan: 3 },
    ],
  }), [t]);

  const kakaoAgencyFieldMap: Record<KakaoMessengerDetailsDtoAgency, ProviderFieldGroup> = useMemo(() => ({
    NHN_CLOUD: {
      cols: 2,
      fields: [
        { name: 'messenger.kakao.nhn.appKey', label: t('systemManagement.notification.kakaoAppKey'), placeholder: 'NHN Cloud 알림톡 AppKey' },
        { name: 'messenger.kakao.nhn.secretKey', label: t('systemManagement.notification.kakaoSecretKey'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password' },
      ],
    },
    SOLAPI: {
      cols: 2,
      fields: [
        { name: 'messenger.kakao.solapi.apiKey', label: t('systemManagement.notification.solapiApiKey'), placeholder: '솔라피 API Key' },
        { name: 'messenger.kakao.solapi.apiSecret', label: t('systemManagement.notification.solapiApiSecret'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password' },
      ],
    },
    ALIGO: {
      cols: 2,
      fields: [
        { name: 'messenger.kakao.aligo.userId', label: t('systemManagement.notification.aligoUserId'), placeholder: '알리고 사용자 ID' },
        { name: 'messenger.kakao.aligo.apiKey', label: t('systemManagement.notification.aligoApiKey'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password' },
      ],
    },
  }), [t]);

  const globalMessengerFieldMap: Record<Exclude<MessengerConfigDtoProvider, 'KAKAO'>, ProviderFieldGroup> = useMemo(() => ({
    LINE: {
      cols: 2,
      fields: [
        { name: 'messenger.line.channelSecret', label: t('systemManagement.notification.lineChannelSecret'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password' },
        { name: 'messenger.line.accessToken', label: t('systemManagement.notification.lineAccessToken'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password' },
      ],
    },
    WHATSAPP: {
      cols: 2,
      fields: [
        { name: 'messenger.whatsapp.businessAccountId', label: t('systemManagement.notification.whatsappBusinessAccountId'), placeholder: 'Business Account ID' },
        { name: 'messenger.whatsapp.accessToken', label: t('systemManagement.notification.whatsappAccessToken'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password' },
      ],
    },
    TELEGRAM: {
      cols: 1,
      fields: [
        { name: 'messenger.telegram.botToken', label: t('systemManagement.notification.telegramBotToken'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password' },
      ],
    },
    WECHAT: {
      cols: 1,
      fields: [
        { name: 'messenger.wechat.appSecret', label: t('systemManagement.notification.wechatAppSecret'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password' },
      ],
    },
  }), [t]);

  const smsFieldMap: Record<SmsConfigDtoProvider, ProviderFieldGroup> = useMemo(() => ({
    NHN_SMS: {
      cols: 2,
      fields: [
        { name: 'sms.nhn.appKey', label: t('systemManagement.notification.smsNhnAppKey'), placeholder: 'NHN Cloud SMS AppKey' },
        { name: 'sms.nhn.secretKey', label: t('systemManagement.notification.smsNhnSecretKey'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password' },
      ],
    },
    SOLAPI_SMS: {
      cols: 2,
      fields: [
        { name: 'sms.solapi.apiKey', label: t('systemManagement.notification.solapiApiKey'), placeholder: '솔라피 API Key' },
        { name: 'sms.solapi.apiSecret', label: t('systemManagement.notification.solapiApiSecret'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password' },
      ],
    },
    ALIGO_SMS: {
      cols: 2,
      fields: [
        { name: 'sms.aligo.userId', label: t('systemManagement.notification.aligoUserId'), placeholder: '알리고 사용자 ID' },
        { name: 'sms.aligo.apiKey', label: t('systemManagement.notification.aligoApiKey'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password' },
      ],
    },
  }), [t]);

  const pushFieldMap: Record<PushConfigDtoProvider, ProviderFieldGroup> = useMemo(() => ({
    FCM: {
      cols: 2,
      fields: [
        { name: 'push.fcm.projectId', label: t('systemManagement.notification.pushProjectId'), placeholder: 'service-factory-app' },
        { name: 'push.fcm.apiKey', label: t('systemManagement.notification.pushApiKey'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password' },
      ],
    },
    NHN_PUSH: {
      cols: 2,
      fields: [
        { name: 'push.nhn.appKey', label: t('systemManagement.notification.nhnPushAppKey'), placeholder: 'NHN Cloud Push AppKey' },
        { name: 'push.nhn.secretKey', label: t('systemManagement.notification.nhnPushSecretKey'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password' },
      ],
    },
    AWS_SNS_PUSH: {
      cols: 2,
      fields: [
        { name: 'push.sns.region', label: t('systemManagement.notification.awsPushRegion'), placeholder: 'ap-northeast-2' },
        { name: 'push.sns.platformApplicationArn', label: t('systemManagement.notification.awsPushPlatformArn'), placeholder: 'arn:aws:sns:ap-northeast-2:123456789012:app/...' },
        { name: 'push.sns.accessKeyId', label: t('systemManagement.notification.awsPushAccessKeyId'), placeholder: 'AKIAIOSFODNN7EXAMPLE' },
        { name: 'push.sns.secretAccessKey', label: t('systemManagement.notification.awsPushSecretAccessKey'), placeholder: t('systemManagement.notification.smtpPassDesc'), type: 'password' },
      ],
    },
    ORACLE_ONS_PUSH: {
      cols: 3,
      fields: [
        { name: 'push.oracle.region', label: t('systemManagement.notification.oraclePushRegion'), placeholder: 'ap-seoul-1' },
        { name: 'push.oracle.compartmentId', label: t('systemManagement.notification.oraclePushCompartmentId'), placeholder: 'ocid1.compartment.oc1...' },
        { name: 'push.oracle.topicId', label: t('systemManagement.notification.oraclePushTopicId'), placeholder: 'ocid1.onstopic.oc1...' },
      ],
    },
  }), [t]);

  const smsProviderOptions = useMemo<Array<{ label: string, value: SmsConfigDtoProvider }>>(() => [
    { label: t('systemManagement.notification.providers.sms.NHN_SMS'), value: 'NHN_SMS' },
    { label: t('systemManagement.notification.providers.sms.SOLAPI_SMS'), value: 'SOLAPI_SMS' },
    { label: t('systemManagement.notification.providers.sms.ALIGO_SMS'), value: 'ALIGO_SMS' },
  ], [t]);

  const pushProviderOptions = useMemo<Array<{ label: string, value: PushConfigDtoProvider }>>(() => [
    { label: t('systemManagement.notification.providers.push.FCM'), value: 'FCM' },
    { label: t('systemManagement.notification.providers.push.NHN_PUSH'), value: 'NHN_PUSH' },
    { label: t('systemManagement.notification.providers.push.AWS_SNS_PUSH'), value: 'AWS_SNS_PUSH' },
    { label: t('systemManagement.notification.providers.push.ORACLE_ONS_PUSH'), value: 'ORACLE_ONS_PUSH' },
  ], [t]);

  const messengerOptions = useMemo<Array<{ label: string, value: MessengerConfigDtoProvider }>>(() => [
    { label: t('systemManagement.notification.providers.messenger.KAKAO'), value: 'KAKAO' },
    { label: t('systemManagement.notification.providers.messenger.LINE'), value: 'LINE' },
    { label: t('systemManagement.notification.providers.messenger.WHATSAPP'), value: 'WHATSAPP' },
    { label: t('systemManagement.notification.providers.messenger.TELEGRAM'), value: 'TELEGRAM' },
    { label: t('systemManagement.notification.providers.messenger.WECHAT'), value: 'WECHAT' },
  ], [t]);

  const kakaoAgencyOptions = useMemo<Array<{ label: string, value: KakaoMessengerDetailsDtoAgency }>>(() => [
    { label: t('systemManagement.notification.providers.agencies.kakao.NHN_CLOUD'), value: 'NHN_CLOUD' },
    { label: t('systemManagement.notification.providers.agencies.kakao.SOLAPI'), value: 'SOLAPI' },
    { label: t('systemManagement.notification.providers.agencies.kakao.ALIGO'), value: 'ALIGO' },
  ], [t]);

  const directAgencyOptions = useMemo<Array<{ label: string, value: string }>>(() => [
    { label: t('systemManagement.notification.providers.agencies.direct'), value: 'DIRECT' },
  ], [t]);

  const notiForm = useAppForm({
    defaultValues: {
      email: {
        from: notification?.email?.from ?? '',
        smtp: {
          host: notification?.email?.smtp?.host ?? '',
          port: notification?.email?.smtp?.port ?? 587,
          secure: notification?.email?.smtp?.secure ?? false,
          user: notification?.email?.smtp?.user ?? '',
          pass: '',
        },
      },
      messenger: {
        enabled: notification?.messenger?.enabled ?? false,
        provider: (notification?.messenger?.provider ?? 'KAKAO'),
        kakao: {
          plusFriendId: notification?.messenger?.kakao?.plusFriendId ?? '',
          senderKey: notification?.messenger?.kakao?.senderKey ?? '',
          agency: (notification?.messenger?.kakao?.agency ?? 'NHN_CLOUD'),
          nhn: {
            appKey: notification?.messenger?.kakao?.nhn?.appKey ?? '',
            secretKey: '',
          },
          solapi: {
            apiKey: notification?.messenger?.kakao?.solapi?.apiKey ?? '',
            apiSecret: '',
          },
          aligo: {
            userId: notification?.messenger?.kakao?.aligo?.userId ?? '',
            apiKey: '',
          },
        },
        line: {
          channelId: notification?.messenger?.line?.channelId ?? '',
          channelSecret: notification?.messenger?.line?.channelSecret ?? '',
          accessToken: notification?.messenger?.line?.accessToken ?? '',
        },
        whatsapp: {
          phoneNumberId: notification?.messenger?.whatsapp?.phoneNumberId ?? '',
          businessAccountId: notification?.messenger?.whatsapp?.businessAccountId ?? '',
          accessToken: notification?.messenger?.whatsapp?.accessToken ?? '',
        },
        telegram: {
          botToken: notification?.messenger?.telegram?.botToken ?? '',
          chatId: notification?.messenger?.telegram?.chatId ?? '',
        },
        wechat: {
          appId: notification?.messenger?.wechat?.appId ?? '',
          appSecret: notification?.messenger?.wechat?.appSecret ?? '',
        },
      },
      sms: {
        enabled: notification?.sms?.enabled ?? false,
        provider: (notification?.sms?.provider ?? 'NHN_SMS'),
        nhn: {
          appKey: notification?.sms?.nhn?.appKey ?? '',
          secretKey: '',
          senderPhone: notification?.sms?.nhn?.senderPhone ?? '',
        },
        solapi: {
          apiKey: notification?.sms?.solapi?.apiKey ?? '',
          apiSecret: '',
          senderPhone: notification?.sms?.solapi?.senderPhone ?? '',
        },
        aligo: {
          userId: notification?.sms?.aligo?.userId ?? '',
          apiKey: '',
          sender: notification?.sms?.aligo?.sender ?? '',
        },
      },
      push: {
        enabled: notification?.push?.enabled ?? false,
        provider: (notification?.push?.provider ?? 'FCM'),
        fcm: {
          projectId: notification?.push?.fcm?.projectId ?? '',
          apiKey: notification?.push?.fcm?.apiKey ?? '',
        },
        nhn: {
          appKey: notification?.push?.nhn?.appKey ?? '',
          secretKey: notification?.push?.nhn?.secretKey ?? '',
        },
        sns: {
          region: notification?.push?.sns?.region ?? 'ap-northeast-2',
          platformApplicationArn: notification?.push?.sns?.platformApplicationArn ?? '',
          accessKeyId: notification?.push?.sns?.accessKeyId ?? '',
          secretAccessKey: notification?.push?.sns?.secretAccessKey ?? '',
        },
        oracle: {
          region: notification?.push?.oracle?.region ?? 'ap-seoul-1',
          compartmentId: notification?.push?.oracle?.compartmentId ?? '',
          topicId: notification?.push?.oracle?.topicId ?? '',
        },
      },
    },
  });

  useImperativeHandle(ref, () => ({
    submitData: async () => {
      const isValid = await notiForm.validateAllFields('submit');
      if (!isValid) {
        return null;
      }
      return notiForm.state.values;
    },
  }));

  const testEmailMutation = useSystemConfigControllerTestEmail();
  const testSmsMutation = useSystemConfigControllerTestSms();
  const testPushMutation = useSystemConfigControllerTestPush();
  const testMessengerMutation = useSystemConfigControllerTestMessenger();

  const handleTestEmail = () => {
    const values = notiForm.state.values.email;
    const recipient = extractRecipientEmail(values.from);

    testEmailMutation.mutate({
      data: {
        to: recipient,
        config: values,
      },
    });
  };

  const handleTestSms = () => {
    const values = notiForm.state.values.sms;
    const senderPhone = values.nhn.senderPhone || values.solapi.senderPhone || values.aligo.sender || '';

    testSmsMutation.mutate({
      data: {
        to: senderPhone,
        config: values,
      },
    });
  };

  const handleTestPush = () => {
    const values = notiForm.state.values.push;
    const testToken = values.fcm.apiKey || values.nhn.appKey || '';

    testPushMutation.mutate({
      data: {
        token: testToken,
        config: values,
      },
    });
  };

  const handleTestMessenger = () => {
    const values = notiForm.state.values.messenger;
    const targetRecipient = values.kakao.plusFriendId || values.telegram.chatId || values.whatsapp.phoneNumberId || '';

    testMessengerMutation.mutate({
      data: {
        recipient: targetRecipient,
        config: values,
      },
    });
  };

  const renderProviderFields = (group: ProviderFieldGroup | undefined, disabled?: boolean) => {
    if (!group) {
      return null;
    }
    const gridColsClass = getGridColsClass(group.cols);

    return (
      <div className={`
        grid grid-cols-1 gap-4
        ${gridColsClass}
      `}
      >
        {group.fields.map((fieldMeta) => {
          const colSpanClass = getColSpanClass(fieldMeta.colSpan);

          return (
            <div
              key={fieldMeta.name}
              className={`${colSpanClass} ${fieldMeta.className ?? ''}`.trim() || undefined}
            >
              <notiForm.AppField name={fieldMeta.name}>
                {(field) => {
                  if (fieldMeta.type === 'switch') {
                    return (
                      <div className="flex flex-col gap-2">
                        <span className="
                          text-sm font-medium leading-none select-none
                          text-transparent
                        "
                        >
                          &nbsp;
                        </span>
                        <label className="
                          flex h-10 items-center gap-2.5 cursor-pointer
                          select-none
                        "
                        >
                          <Switch
                            id={fieldMeta.name}
                            checked={Boolean(field.state.value)}
                            onCheckedChange={field.handleChange}
                            disabled={disabled}
                          />
                          <FieldLabel
                            htmlFor={fieldMeta.name}
                            className="cursor-pointer"
                          >
                            {fieldMeta.label}
                          </FieldLabel>
                        </label>
                      </div>
                    );
                  }

                  return (
                    fieldMeta.type === 'textarea'
                      ? <field.Textarea label={fieldMeta.label} placeholder={fieldMeta.placeholder} disabled={disabled} rows={8} />
                      : <field.Input type={fieldMeta.type ?? 'text'} label={fieldMeta.label} placeholder={fieldMeta.placeholder} disabled={disabled} />
                  );
                }}
              </notiForm.AppField>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <notiForm.AppForm>
      <FormLayout
        id="notification-form"
        onSubmit={() => void notiForm.handleSubmit()}
        className="flex flex-col gap-6"
      >
        {/* 1. 이메일 발송 설정 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="mail"
          title={t('systemManagement.notification.emailTitle')}
          description={t('systemManagement.notification.emailDescription')}
        >
          <SectionCard.Content>
            <div className="space-y-4">
              <div className="flex items-end gap-2 max-w-lg">
                <div className="flex-1">
                  <notiForm.AppField name="email.from">
                    {(field) => (
                      <field.Input
                        label={t('systemManagement.notification.smtpFrom')}
                        placeholder="Service Factory <noreply@example.com>"
                        showError={false}
                      />
                    )}
                  </notiForm.AppField>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="shrink-0"
                  disabled={testEmailMutation.isPending}
                  onClick={handleTestEmail}
                >
                  <Send className="size-3.5 mr-1.5" />
                  {testEmailMutation.isPending ? '...' : t('systemManagement.notification.testSend')}
                </Button>
              </div>

              {renderProviderFields(emailSmtpGroup)}
            </div>
          </SectionCard.Content>
        </SectionCard>

        {/* 2. 비즈니스 메신저 발송 설정 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="message-circle"
          title={t('systemManagement.notification.messengerTitle')}
          description={t('systemManagement.notification.messengerDescription')}
        >
          <SectionCard.Actions>
            <notiForm.AppField name="messenger.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label={t('systemManagement.notification.messengerEnabled')}
                />
              )}
            </notiForm.AppField>
          </SectionCard.Actions>

          <SectionCard.Content>
            <notiForm.AppField name="messenger.enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <div className="space-y-4">
                    <div className="
                      grid grid-cols-1
                      sm:grid-cols-2
                      gap-4 max-w-md
                    "
                    >
                      <div className="
                        w-full
                        [&_button]:w-full
                      "
                      >
                        <notiForm.AppField name="messenger.provider">
                          {(field) => (
                            <field.Select
                              label={t('systemManagement.notification.messengerProvider')}
                              options={messengerOptions}
                              disabled={!isEnabled}
                              showError={false}
                            />
                          )}
                        </notiForm.AppField>
                      </div>

                      <div className="
                        w-full
                        [&_button]:w-full
                      "
                      >
                        <notiForm.AppField name="messenger.provider">
                          {(providerField) => {
                            const currentProvider = providerField.state.value;
                            if (currentProvider === 'KAKAO') {
                              return (
                                <notiForm.AppField name="messenger.kakao.agency">
                                  {(agencyField) => (
                                    <agencyField.Select
                                      label={t('systemManagement.notification.messengerAgency')}
                                      options={kakaoAgencyOptions}
                                      disabled={!isEnabled}
                                      showError={false}
                                    />
                                  )}
                                </notiForm.AppField>
                              );
                            }
                            return (
                              <Field
                                orientation="vertical"
                                className="flex flex-col gap-2"
                              >
                                <FieldLabel className="
                                  flex-none whitespace-nowrap select-none
                                  justify-self-start
                                "
                                >
                                  {t('systemManagement.notification.messengerAgency')}
                                </FieldLabel>
                                <Select
                                  disabled={!isEnabled}
                                  value="DIRECT"
                                  items={directAgencyOptions}
                                >
                                  <SelectTrigger className="w-full" disabled={!isEnabled}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {directAgencyOptions.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </Field>
                            );
                          }}
                        </notiForm.AppField>
                      </div>
                    </div>

                    <notiForm.AppField name="messenger.provider">
                      {(providerField) => {
                        const currentProvider = providerField.state.value;

                        if (currentProvider === 'KAKAO') {
                          return (
                            <div className="
                              flex flex-wrap items-end gap-3 max-w-xl
                            "
                            >
                              <div className="w-56">
                                <notiForm.AppField name="messenger.kakao.plusFriendId">
                                  {(field) => (
                                    <field.Input
                                      label={t('systemManagement.notification.kakaoPlusFriendId')}
                                      placeholder="@service_factory"
                                      disabled={!isEnabled}
                                      showError={false}
                                    />
                                  )}
                                </notiForm.AppField>
                              </div>
                              <div className="flex-1 min-w-[200px]">
                                <notiForm.AppField name="messenger.kakao.senderKey">
                                  {(field) => (
                                    <field.Input
                                      label={t('systemManagement.notification.kakaoSenderKey')}
                                      placeholder="sender-key-1234..."
                                      disabled={!isEnabled}
                                      showError={false}
                                    />
                                  )}
                                </notiForm.AppField>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="default"
                                className="shrink-0"
                                disabled={!isEnabled || testMessengerMutation.isPending}
                                onClick={handleTestMessenger}
                              >
                                <Send className="size-3.5 mr-1.5" />
                                {testMessengerMutation.isPending ? '...' : t('systemManagement.notification.testSend')}
                              </Button>
                            </div>
                          );
                        }

                        // LINE
                        if (currentProvider === 'LINE') {
                          return (
                            <div className="flex items-end gap-2 max-w-md">
                              <div className="flex-1">
                                <notiForm.AppField name="messenger.line.channelId">
                                  {(field) => (
                                    <field.Input
                                      label={t('systemManagement.notification.lineChannelId')}
                                      placeholder="LINE Channel ID"
                                      disabled={!isEnabled}
                                      showError={false}
                                    />
                                  )}
                                </notiForm.AppField>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="default"
                                className="shrink-0"
                                disabled={!isEnabled || testMessengerMutation.isPending}
                                onClick={handleTestMessenger}
                              >
                                <Send className="size-3.5 mr-1.5" />
                                {testMessengerMutation.isPending ? '...' : t('systemManagement.notification.testSend')}
                              </Button>
                            </div>
                          );
                        }

                        // WhatsApp
                        if (currentProvider === 'WHATSAPP') {
                          return (
                            <div className="flex items-end gap-2 max-w-md">
                              <div className="flex-1">
                                <notiForm.AppField name="messenger.whatsapp.phoneNumberId">
                                  {(field) => (
                                    <field.Input
                                      label={t('systemManagement.notification.whatsappPhoneNumberId')}
                                      placeholder="Phone Number ID"
                                      disabled={!isEnabled}
                                      showError={false}
                                    />
                                  )}
                                </notiForm.AppField>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="default"
                                className="shrink-0"
                                disabled={!isEnabled || testMessengerMutation.isPending}
                                onClick={handleTestMessenger}
                              >
                                <Send className="size-3.5 mr-1.5" />
                                {testMessengerMutation.isPending ? '...' : t('systemManagement.notification.testSend')}
                              </Button>
                            </div>
                          );
                        }

                        // Telegram
                        if (currentProvider === 'TELEGRAM') {
                          return (
                            <div className="flex items-end gap-2 max-w-md">
                              <div className="flex-1">
                                <notiForm.AppField name="messenger.telegram.chatId">
                                  {(field) => (
                                    <field.Input
                                      label={t('systemManagement.notification.telegramChatId')}
                                      placeholder="-1001234567890"
                                      disabled={!isEnabled}
                                      showError={false}
                                    />
                                  )}
                                </notiForm.AppField>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="default"
                                className="shrink-0"
                                disabled={!isEnabled || testMessengerMutation.isPending}
                                onClick={handleTestMessenger}
                              >
                                <Send className="size-3.5 mr-1.5" />
                                {testMessengerMutation.isPending ? '...' : t('systemManagement.notification.testSend')}
                              </Button>
                            </div>
                          );
                        }

                        // WeChat
                        return (
                          <div className="flex items-end gap-2 max-w-md">
                            <div className="flex-1">
                              <notiForm.AppField name="messenger.wechat.appId">
                                {(field) => (
                                  <field.Input
                                    label={t('systemManagement.notification.wechatAppId')}
                                    placeholder="WeChat Official AppID"
                                    disabled={!isEnabled}
                                    showError={false}
                                  />
                                )}
                              </notiForm.AppField>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="default"
                              className="shrink-0"
                              disabled={!isEnabled || testMessengerMutation.isPending}
                              onClick={handleTestMessenger}
                            >
                              <Send className="size-3.5 mr-1.5" />
                              {testMessengerMutation.isPending ? '...' : t('systemManagement.notification.testSend')}
                            </Button>
                          </div>
                        );
                      }}
                    </notiForm.AppField>

                    <notiForm.AppField name="messenger.provider">
                      {(providerField) => {
                        const current = providerField.state.value;
                        if (current === 'KAKAO') {
                          return (
                            <notiForm.AppField name="messenger.kakao.agency">
                              {(agencyField) => {
                                const currentAgency = agencyField.state.value;
                                return renderProviderFields(kakaoAgencyFieldMap[currentAgency], !isEnabled);
                              }}
                            </notiForm.AppField>
                          );
                        }
                        return renderProviderFields(globalMessengerFieldMap[current], !isEnabled);
                      }}
                    </notiForm.AppField>
                  </div>
                );
              }}
            </notiForm.AppField>
          </SectionCard.Content>
        </SectionCard>

        {/* 3. SMS 문자 발송 설정 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="phone"
          title={t('systemManagement.notification.smsTitle')}
          description={t('systemManagement.notification.smsDescription')}
        >
          <SectionCard.Actions>
            <notiForm.AppField name="sms.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label={t('systemManagement.notification.smsEnabled')}
                />
              )}
            </notiForm.AppField>
          </SectionCard.Actions>

          <SectionCard.Content>
            <notiForm.AppField name="sms.enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <div className="space-y-4">
                    <div className="max-w-md">
                      <notiForm.AppField name="sms.provider">
                        {(field) => (
                          <field.Select
                            label={t('systemManagement.notification.smsProvider')}
                            options={smsProviderOptions}
                            disabled={!isEnabled}
                            showError={false}
                          />
                        )}
                      </notiForm.AppField>
                    </div>

                    <div className="flex items-end gap-2 max-w-md">
                      <div className="flex-1">
                        <notiForm.AppField name="sms.provider">
                          {(providerField) => {
                            const fieldName = getSmsSenderFieldName(providerField.state.value);

                            return (
                              <notiForm.AppField name={fieldName}>
                                {(senderField) => (
                                  <senderField.Input
                                    label={t('systemManagement.notification.smsSenderPhone')}
                                    placeholder="1588-0000"
                                    disabled={!isEnabled}
                                    showError={false}
                                  />
                                )}
                              </notiForm.AppField>
                            );
                          }}
                        </notiForm.AppField>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        className="shrink-0"
                        disabled={!isEnabled || testSmsMutation.isPending}
                        onClick={handleTestSms}
                      >
                        <Send className="size-3.5 mr-1.5" />
                        {testSmsMutation.isPending ? '...' : t('systemManagement.notification.testSend')}
                      </Button>
                    </div>

                    <notiForm.AppField name="sms.provider">
                      {(providerField) => {
                        const current = providerField.state.value;
                        return renderProviderFields(smsFieldMap[current], !isEnabled);
                      }}
                    </notiForm.AppField>
                  </div>
                );
              }}
            </notiForm.AppField>
          </SectionCard.Content>
        </SectionCard>

        {/* 4. 웹/모바일 푸시 알림 설정 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="bell"
          title={t('systemManagement.notification.pushTitle')}
          description={t('systemManagement.notification.pushDescription')}
        >
          <SectionCard.Actions>
            <notiForm.AppField name="push.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label={t('systemManagement.notification.pushEnabled')}
                />
              )}
            </notiForm.AppField>
          </SectionCard.Actions>

          <SectionCard.Content>
            <notiForm.AppField name="push.enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <div className="space-y-4">
                    <div className="flex items-end gap-2 max-w-sm">
                      <div className="flex-1">
                        <notiForm.AppField name="push.provider">
                          {(field) => (
                            <field.Select
                              label={t('systemManagement.notification.pushProvider')}
                              options={pushProviderOptions}
                              disabled={!isEnabled}
                              showError={false}
                            />
                          )}
                        </notiForm.AppField>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        className="shrink-0"
                        disabled={!isEnabled || testPushMutation.isPending}
                        onClick={handleTestPush}
                      >
                        <Send className="size-3.5 mr-1.5" />
                        {testPushMutation.isPending ? '...' : t('systemManagement.notification.testSend')}
                      </Button>
                    </div>

                    <notiForm.AppField name="push.provider">
                      {(providerField) => {
                        const current = providerField.state.value;
                        return renderProviderFields(pushFieldMap[current], !isEnabled);
                      }}
                    </notiForm.AppField>
                  </div>
                );
              }}
            </notiForm.AppField>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </notiForm.AppForm>
  );
});
