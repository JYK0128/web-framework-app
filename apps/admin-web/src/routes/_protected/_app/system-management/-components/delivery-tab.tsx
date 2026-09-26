import { Send } from 'lucide-react';
import { forwardRef, useImperativeHandle, useMemo } from 'react';

import { useSystemConfigControllerTestEmailV1, useSystemConfigControllerTestMessengerV1, useSystemConfigControllerTestPushV1, useSystemConfigControllerTestSmsV1 } from '#/.generated/api/endpoints/system-configs/system-configs';
import { type DeliveryConfigDto, type KakaoMessengerDetailsDtoAgency, type MessengerConfigDtoProvider, type PushConfigDtoProvider, type SmsConfigDtoProvider } from '#/.generated/api/model';
import { Button, FieldLabel, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';

export interface DeliveryTabHandle {
  submitData: () => Promise<DeliveryConfigDto | null>
}

export interface DeliveryTabProps {
  delivery?: Partial<DeliveryConfigDto>
}

type DeliveryFormFieldName
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
    | 'push.fcm.projectId' | 'push.fcm.clientEmail'
    | 'push.nhn.appKey' | 'push.nhn.userAccessKeyId' | 'push.nhn.secretAccessKey'
    ;

interface FieldSchema {
  name: DeliveryFormFieldName
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

function getSmsSenderFieldName(provider: SmsConfigDtoProvider): DeliveryFormFieldName {
  if (provider === 'ALIGO_SMS') return 'sms.aligo.sender';
  if (provider === 'SOLAPI_SMS') return 'sms.solapi.senderPhone';
  return 'sms.nhn.senderPhone';
}

export const DeliveryTab = forwardRef<DeliveryTabHandle, DeliveryTabProps>(function DeliveryTab(
  { delivery }: DeliveryTabProps,
  ref,
) {
  const emailSmtpGroup: ProviderFieldGroup = useMemo(() => ({
    cols: 6,
    fields: [
      { name: 'email.smtp.host', label: 'SMTP 호스트 서버 주소', placeholder: 'smtp.gmail.com / email-smtp.amazonaws.com', colSpan: 2 },
      { name: 'email.smtp.port', label: 'SMTP 포트', placeholder: '587', type: 'number', colSpan: 2 },
      { name: 'email.smtp.secure', label: '보안 연결', type: 'switch', colSpan: 2 },
      { name: 'email.smtp.user', label: 'SMTP 인증 계정', placeholder: 'user@example.com / SMTP Username', colSpan: 3 },
      { name: 'email.smtp.pass', label: 'SMTP 인증 비밀번호', placeholder: '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.', type: 'password', colSpan: 3 },
    ],
  }), []);

  const kakaoAgencyFieldMap: Record<KakaoMessengerDetailsDtoAgency, ProviderFieldGroup> = useMemo(() => ({
    NHN_CLOUD: {
      cols: 2,
      fields: [
        { name: 'messenger.kakao.nhn.appKey', label: 'NHN Cloud AppKey', placeholder: 'NHN Cloud 알림톡 AppKey' },
        { name: 'messenger.kakao.nhn.secretKey', label: 'NHN Cloud SecretKey', placeholder: '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.', type: 'password' },
      ],
    },
    SOLAPI: {
      cols: 2,
      fields: [
        { name: 'messenger.kakao.solapi.apiKey', label: '솔라피 API Key', placeholder: '솔라피 API Key' },
        { name: 'messenger.kakao.solapi.apiSecret', label: '솔라피 API Secret', placeholder: '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.', type: 'password' },
      ],
    },
    ALIGO: {
      cols: 2,
      fields: [
        { name: 'messenger.kakao.aligo.userId', label: '알리고 사용자 ID', placeholder: '알리고 사용자 ID' },
        { name: 'messenger.kakao.aligo.apiKey', label: '알리고 API Key', placeholder: '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.', type: 'password' },
      ],
    },
  }), []);

  const globalMessengerFieldMap: Record<Exclude<MessengerConfigDtoProvider, 'KAKAO'>, ProviderFieldGroup> = useMemo(() => ({
    LINE: {
      cols: 2,
      fields: [
        { name: 'messenger.line.channelSecret', label: 'LINE Channel Secret', placeholder: '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.', type: 'password' },
        { name: 'messenger.line.accessToken', label: 'Channel Access Token', placeholder: '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.', type: 'password' },
      ],
    },
    WHATSAPP: {
      cols: 2,
      fields: [
        { name: 'messenger.whatsapp.businessAccountId', label: 'Business Account ID', placeholder: 'Business Account ID' },
        { name: 'messenger.whatsapp.accessToken', label: 'System User Access Token', placeholder: '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.', type: 'password' },
      ],
    },
    TELEGRAM: {
      cols: 1,
      fields: [
        { name: 'messenger.telegram.botToken', label: 'Telegram Bot Token', placeholder: '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.', type: 'password' },
      ],
    },
    WECHAT: {
      cols: 1,
      fields: [
        { name: 'messenger.wechat.appSecret', label: 'WeChat AppSecret', placeholder: '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.', type: 'password' },
      ],
    },
  }), []);

  const smsFieldMap: Record<SmsConfigDtoProvider, ProviderFieldGroup> = useMemo(() => ({
    NHN_SMS: {
      cols: 2,
      fields: [
        { name: 'sms.nhn.appKey', label: 'NHN Cloud AppKey', placeholder: 'NHN Cloud SMS AppKey' },
        { name: 'sms.nhn.secretKey', label: 'NHN Cloud SecretKey', placeholder: '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.', type: 'password' },
      ],
    },
    SOLAPI_SMS: {
      cols: 2,
      fields: [
        { name: 'sms.solapi.apiKey', label: '솔라피 API Key', placeholder: '솔라피 API Key' },
        { name: 'sms.solapi.apiSecret', label: '솔라피 API Secret', placeholder: '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.', type: 'password' },
      ],
    },
    ALIGO_SMS: {
      cols: 2,
      fields: [
        { name: 'sms.aligo.userId', label: '알리고 사용자 ID', placeholder: '알리고 사용자 ID' },
        { name: 'sms.aligo.apiKey', label: '알리고 API Key', placeholder: '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.', type: 'password' },
      ],
    },
  }), []);

  const pushFieldMap: Partial<Record<PushConfigDtoProvider, ProviderFieldGroup>> = useMemo(() => ({
    FCM: {
      cols: 2,
      fields: [
        { name: 'push.fcm.projectId', label: 'Firebase Project ID', placeholder: 'service-factory-app' },
        { name: 'push.fcm.clientEmail', label: 'FCM 서비스 계정 이메일', placeholder: '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.' },
      ],
    },
    NHN_PUSH: {
      cols: 2,
      fields: [
        { name: 'push.nhn.appKey', label: 'NHN Cloud Push AppKey', placeholder: 'NHN Cloud Push AppKey' },
        { name: 'push.nhn.userAccessKeyId', label: 'NHN Cloud User Access Key ID', placeholder: 'User Access Key ID' },
        { name: 'push.nhn.secretAccessKey', label: 'NHN Cloud Secret Access Key', placeholder: '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.', type: 'password' },
      ],
    },
  }), []);

  const smsProviderOptions = useMemo<Array<{ label: string, value: SmsConfigDtoProvider }>>(() => [
    { label: 'NHN Cloud SMS', value: 'NHN_SMS' },
    { label: '솔라피', value: 'SOLAPI_SMS' },
    { label: '알리고', value: 'ALIGO_SMS' },
  ], []);

  const pushProviderOptions = useMemo<Array<{ label: string, value: PushConfigDtoProvider }>>(() => [
    { label: 'Firebase Cloud Messaging', value: 'FCM' },
    { label: 'NHN Cloud Push', value: 'NHN_PUSH' },
  ], []);

  const messengerOptions = useMemo<Array<{ label: string, value: MessengerConfigDtoProvider }>>(() => [
    { label: '카카오 알림톡', value: 'KAKAO' },
    { label: '라인', value: 'LINE' },
    { label: '왓츠앱', value: 'WHATSAPP' },
    { label: '텔레그램', value: 'TELEGRAM' },
    { label: '위챗', value: 'WECHAT' },
  ], []);

  const kakaoAgencyOptions = useMemo<Array<{ label: string, value: KakaoMessengerDetailsDtoAgency }>>(() => [
    { label: 'NHN Cloud', value: 'NHN_CLOUD' },
    { label: '솔라피', value: 'SOLAPI' },
    { label: '알리고', value: 'ALIGO' },
  ], []);

  const directAgencyOptions = useMemo<Array<{ label: string, value: string }>>(() => [
    { label: '공식 개발자 API 직접 연동', value: 'DIRECT' },
  ], []);

  const deliveryForm = useAppForm({
    defaultValues: {
      email: {
        from: delivery?.email?.from ?? '',
        smtp: {
          host: delivery?.email?.smtp?.host ?? '',
          port: delivery?.email?.smtp?.port,
          secure: delivery?.email?.smtp?.secure,
          user: delivery?.email?.smtp?.user ?? '',
          pass: '',
        },
      },
      messenger: {
        enabled: delivery?.messenger?.enabled ?? false,
        provider: delivery?.messenger?.provider ?? 'KAKAO',
        kakao: {
          plusFriendId: delivery?.messenger?.kakao?.plusFriendId ?? '',
          senderKey: delivery?.messenger?.kakao?.senderKey ?? '',
          agency: delivery?.messenger?.kakao?.agency,
          nhn: {
            appKey: delivery?.messenger?.kakao?.nhn?.appKey ?? '',
            secretKey: '',
          },
          solapi: {
            apiKey: delivery?.messenger?.kakao?.solapi?.apiKey ?? '',
            apiSecret: '',
          },
          aligo: {
            userId: delivery?.messenger?.kakao?.aligo?.userId ?? '',
            apiKey: '',
          },
        },
        line: {
          channelId: delivery?.messenger?.line?.channelId ?? '',
          channelSecret: delivery?.messenger?.line?.channelSecret ?? '',
          accessToken: delivery?.messenger?.line?.accessToken ?? '',
        },
        whatsapp: {
          phoneNumberId: delivery?.messenger?.whatsapp?.phoneNumberId ?? '',
          businessAccountId: delivery?.messenger?.whatsapp?.businessAccountId ?? '',
          accessToken: delivery?.messenger?.whatsapp?.accessToken ?? '',
        },
        telegram: {
          botToken: delivery?.messenger?.telegram?.botToken ?? '',
          chatId: delivery?.messenger?.telegram?.chatId ?? '',
        },
        wechat: {
          appId: delivery?.messenger?.wechat?.appId ?? '',
          appSecret: delivery?.messenger?.wechat?.appSecret ?? '',
        },
      },
      sms: {
        enabled: delivery?.sms?.enabled ?? false,
        provider: delivery?.sms?.provider ?? 'NHN_SMS',
        nhn: {
          appKey: delivery?.sms?.nhn?.appKey ?? '',
          secretKey: '',
          senderPhone: delivery?.sms?.nhn?.senderPhone ?? '',
        },
        solapi: {
          apiKey: delivery?.sms?.solapi?.apiKey ?? '',
          apiSecret: '',
          senderPhone: delivery?.sms?.solapi?.senderPhone ?? '',
        },
        aligo: {
          userId: delivery?.sms?.aligo?.userId ?? '',
          apiKey: '',
          sender: delivery?.sms?.aligo?.sender ?? '',
        },
      },
      push: {
        enabled: delivery?.push?.enabled ?? false,
        provider: delivery?.push?.provider ?? 'FCM',
        fcm: {
          projectId: delivery?.push?.fcm?.projectId ?? '',
          clientEmail: delivery?.push?.fcm?.clientEmail ?? '',
        },
        nhn: {
          appKey: delivery?.push?.nhn?.appKey ?? '',
          userAccessKeyId: (delivery?.push?.nhn)?.userAccessKeyId ?? '',
          secretAccessKey: (delivery?.push?.nhn)?.secretAccessKey ?? '',
        },
      },
    },
  });

  useImperativeHandle(ref, () => ({
    submitData: async () => {
      const isValid = await deliveryForm.validateAllFields('submit');
      if (!isValid) {
        return null;
      }
      return deliveryForm.state.values;
    },
  }));

  const testEmailMutation = useSystemConfigControllerTestEmailV1();
  const testSmsMutation = useSystemConfigControllerTestSmsV1();
  const testPushMutation = useSystemConfigControllerTestPushV1();
  const testMessengerMutation = useSystemConfigControllerTestMessengerV1();

  const handleTestEmail = () => {
    const values = deliveryForm.state.values.email;
    const recipient = extractRecipientEmail(values.from);

    testEmailMutation.mutate({
      data: {
        to: recipient,
        config: values,
      },
    });
  };

  const handleTestSms = () => {
    const values = deliveryForm.state.values.sms;
    const senderPhone = values.nhn.senderPhone || values.solapi.senderPhone || values.aligo.sender || '';

    testSmsMutation.mutate({
      data: {
        to: senderPhone,
        config: values,
      },
    });
  };

  const handleTestPush = () => {
    const values = deliveryForm.state.values.push;
    const testToken = values.fcm.clientEmail || values.nhn.appKey || '';

    testPushMutation.mutate({
      data: {
        token: testToken,
        config: values,
      },
    });
  };

  const handleTestMessenger = () => {
    const values = deliveryForm.state.values.messenger;
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
              <deliveryForm.AppField name={fieldMeta.name}>
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
              </deliveryForm.AppField>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <deliveryForm.AppForm>
      <FormLayout
        id="delivery-form"
        onSubmit={() => void deliveryForm.handleSubmit()}
        className="flex flex-col gap-6"
      >
        {/* 1. 이메일 발송 설정 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="mail"
          title="이메일 발송 설정"
          description="표준 SMTP 프로토콜을 통해 메일 서버와 연동합니다."
        >
          <SectionCard.Content>
            <div className="space-y-4">
              <div className="flex items-end gap-2 max-w-lg">
                <div className="flex-1">
                  <deliveryForm.AppField name="email.from">
                    {(field) => (
                      <field.Input
                        label="기본 발신자 명칭 및 주소"
                        placeholder="Service Factory <noreply@example.com>"
                        showError={false}
                      />
                    )}
                  </deliveryForm.AppField>
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
                  {testEmailMutation.isPending ? '...' : '테스트 발송'}
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
          title="비즈니스 메신저 발송 설정"
          description="카카오 알림톡, 라인, 왓츠앱, 텔레그램, 위챗 등 주력 비즈니스 메신저를 선택하여 발송 정보를 설정합니다."
        >
          <SectionCard.Actions>
            <deliveryForm.AppField name="messenger.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label="비즈니스 메신저 발송 활성화"
                />
              )}
            </deliveryForm.AppField>
          </SectionCard.Actions>

          <SectionCard.Content>
            <deliveryForm.AppField name="messenger.enabled">
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
                        <deliveryForm.AppField name="messenger.provider">
                          {(field) => (
                            <field.Select
                              label="메신저 종류"
                              placeholder="메신저 종류를 선택해 주세요"
                              options={messengerOptions}
                              disabled={!isEnabled}
                              showError={false}
                            />
                          )}
                        </deliveryForm.AppField>
                      </div>

                      <div className="
                        w-full
                        [&_button]:w-full
                      "
                      >
                        <deliveryForm.AppField name="messenger.provider">
                          {(providerField) => {
                            const currentProvider = providerField.state.value;
                            if (currentProvider === 'KAKAO') {
                              return (
                                <deliveryForm.AppField name="messenger.kakao.agency">
                                  {(agencyField) => (
                                    <agencyField.Select
                                      label="발송 대행사"
                                      options={kakaoAgencyOptions}
                                      disabled={!isEnabled}
                                      showError={false}
                                    />
                                  )}
                                </deliveryForm.AppField>
                              );
                            }
                            return (
                              <div className="flex flex-col gap-2">
                                <Label className="
                                  flex-none whitespace-nowrap select-none
                                  justify-self-start
                                "
                                >
                                  발송 대행사
                                </Label>
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
                              </div>
                            );
                          }}
                        </deliveryForm.AppField>
                      </div>
                    </div>

                    <deliveryForm.AppField name="messenger.provider">
                      {(providerField) => {
                        const currentProvider = providerField.state.value;

                        if (currentProvider === 'KAKAO') {
                          return (
                            <div className="
                              flex flex-wrap items-end gap-3 max-w-xl
                            "
                            >
                              <div className="w-56">
                                <deliveryForm.AppField name="messenger.kakao.plusFriendId">
                                  {(field) => (
                                    <field.Input
                                      label="카카오 채널 ID"
                                      placeholder="@service_factory"
                                      disabled={!isEnabled}
                                      showError={false}
                                    />
                                  )}
                                </deliveryForm.AppField>
                              </div>
                              <div className="flex-1 min-w-[200px]">
                                <deliveryForm.AppField name="messenger.kakao.senderKey">
                                  {(field) => (
                                    <field.Input
                                      label="발신 프로필 키"
                                      placeholder="sender-key-1234..."
                                      disabled={!isEnabled}
                                      showError={false}
                                    />
                                  )}
                                </deliveryForm.AppField>
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
                                {testMessengerMutation.isPending ? '...' : '테스트 발송'}
                              </Button>
                            </div>
                          );
                        }

                        // LINE
                        if (currentProvider === 'LINE') {
                          return (
                            <div className="flex items-end gap-2 max-w-md">
                              <div className="flex-1">
                                <deliveryForm.AppField name="messenger.line.channelId">
                                  {(field) => (
                                    <field.Input
                                      label="LINE Channel ID"
                                      placeholder="LINE Channel ID"
                                      disabled={!isEnabled}
                                      showError={false}
                                    />
                                  )}
                                </deliveryForm.AppField>
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
                                {testMessengerMutation.isPending ? '...' : '테스트 발송'}
                              </Button>
                            </div>
                          );
                        }

                        // WhatsApp
                        if (currentProvider === 'WHATSAPP') {
                          return (
                            <div className="flex items-end gap-2 max-w-md">
                              <div className="flex-1">
                                <deliveryForm.AppField name="messenger.whatsapp.phoneNumberId">
                                  {(field) => (
                                    <field.Input
                                      label="Phone Number ID"
                                      placeholder="Phone Number ID"
                                      disabled={!isEnabled}
                                      showError={false}
                                    />
                                  )}
                                </deliveryForm.AppField>
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
                                {testMessengerMutation.isPending ? '...' : '테스트 발송'}
                              </Button>
                            </div>
                          );
                        }

                        // Telegram
                        if (currentProvider === 'TELEGRAM') {
                          return (
                            <div className="flex items-end gap-2 max-w-md">
                              <div className="flex-1">
                                <deliveryForm.AppField name="messenger.telegram.chatId">
                                  {(field) => (
                                    <field.Input
                                      label="기본 Chat ID"
                                      placeholder="-1001234567890"
                                      disabled={!isEnabled}
                                      showError={false}
                                    />
                                  )}
                                </deliveryForm.AppField>
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
                                {testMessengerMutation.isPending ? '...' : '테스트 발송'}
                              </Button>
                            </div>
                          );
                        }

                        // WeChat
                        return (
                          <div className="flex items-end gap-2 max-w-md">
                            <div className="flex-1">
                              <deliveryForm.AppField name="messenger.wechat.appId">
                                {(field) => (
                                  <field.Input
                                    label="WeChat Official AppID"
                                    placeholder="WeChat Official AppID"
                                    disabled={!isEnabled}
                                    showError={false}
                                  />
                                )}
                              </deliveryForm.AppField>
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
                              {testMessengerMutation.isPending ? '...' : '테스트 발송'}
                            </Button>
                          </div>
                        );
                      }}
                    </deliveryForm.AppField>

                    <deliveryForm.AppField name="messenger.provider">
                      {(providerField) => {
                        const current = providerField.state.value;
                        if (current === 'KAKAO') {
                          return (
                            <deliveryForm.AppField name="messenger.kakao.agency">
                              {(agencyField) => {
                                const currentAgency = agencyField.state.value;
                                return renderProviderFields(currentAgency ? kakaoAgencyFieldMap[currentAgency] : undefined, !isEnabled);
                              }}
                            </deliveryForm.AppField>
                          );
                        }
                        return renderProviderFields(current ? globalMessengerFieldMap[current] : undefined, !isEnabled);
                      }}
                    </deliveryForm.AppField>
                  </div>
                );
              }}
            </deliveryForm.AppField>
          </SectionCard.Content>
        </SectionCard>

        {/* 3. SMS 문자 발송 설정 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="phone"
          title="SMS 문자 발송 설정"
          description="본인인증 및 긴급 공지 문자를 발송하기 위한 대행사 연동 정보를 설정합니다."
        >
          <SectionCard.Actions>
            <deliveryForm.AppField name="sms.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label="SMS 발송 활성화"
                />
              )}
            </deliveryForm.AppField>
          </SectionCard.Actions>

          <SectionCard.Content>
            <deliveryForm.AppField name="sms.enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <div className="space-y-4">
                    <div className="max-w-md">
                      <deliveryForm.AppField name="sms.provider">
                        {(field) => (
                          <field.Select
                            label="SMS 대행사"
                            placeholder="SMS 대행사를 선택해 주세요"
                            options={smsProviderOptions}
                            disabled={!isEnabled}
                            showError={false}
                          />
                        )}
                      </deliveryForm.AppField>
                    </div>

                    <div className="flex items-end gap-2 max-w-md">
                      <div className="flex-1">
                        <deliveryForm.AppField name="sms.provider">
                          {(providerField) => {
                            const provider = providerField.state.value;
                            if (!provider) return null;
                            const fieldName = getSmsSenderFieldName(provider);

                            return (
                              <deliveryForm.AppField name={fieldName}>
                                {(senderField) => (
                                  <senderField.Input
                                    label="사전 등록 발신번호"
                                    placeholder="1588-0000"
                                    disabled={!isEnabled}
                                    showError={false}
                                  />
                                )}
                              </deliveryForm.AppField>
                            );
                          }}
                        </deliveryForm.AppField>
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
                        {testSmsMutation.isPending ? '...' : '테스트 발송'}
                      </Button>
                    </div>

                    <deliveryForm.AppField name="sms.provider">
                      {(providerField) => {
                        const current = providerField.state.value;
                        return renderProviderFields(current ? smsFieldMap[current] : undefined, !isEnabled);
                      }}
                    </deliveryForm.AppField>
                  </div>
                );
              }}
            </deliveryForm.AppField>
          </SectionCard.Content>
        </SectionCard>

        {/* 4. 웹/모바일 푸시 알림 설정 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="bell"
          title="웹 및 모바일 푸시 알림 설정"
          description="브라우저 및 모바일 앱 푸시 메시지 전송을 위한 프로젝트 연동 정보를 설정합니다."
        >
          <SectionCard.Actions>
            <deliveryForm.AppField name="push.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label="푸시 알림 활성화"
                />
              )}
            </deliveryForm.AppField>
          </SectionCard.Actions>

          <SectionCard.Content>
            <deliveryForm.AppField name="push.enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <div className="space-y-4">
                    <div className="flex items-end gap-2 max-w-sm">
                      <div className="flex-1">
                        <deliveryForm.AppField name="push.provider">
                          {(field) => (
                            <field.Select
                              label="푸시 알림 제공자"
                              placeholder="푸시 알림 제공자를 선택해 주세요"
                              options={pushProviderOptions}
                              disabled={!isEnabled}
                              showError={false}
                            />
                          )}
                        </deliveryForm.AppField>
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
                        {testPushMutation.isPending ? '...' : '테스트 발송'}
                      </Button>
                    </div>

                    <deliveryForm.AppField name="push.provider">
                      {(providerField) => {
                        const current = providerField.state.value;
                        return renderProviderFields(current ? pushFieldMap[current] : undefined, !isEnabled);
                      }}
                    </deliveryForm.AppField>
                  </div>
                );
              }}
            </deliveryForm.AppField>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </deliveryForm.AppForm>
  );
});
