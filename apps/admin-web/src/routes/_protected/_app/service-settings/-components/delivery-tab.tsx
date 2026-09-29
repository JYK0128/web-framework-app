import { Send } from 'lucide-react';
import { forwardRef, useImperativeHandle } from 'react';

import { useSystemConfigControllerTestEmailV1, useSystemConfigControllerTestMessengerV1, useSystemConfigControllerTestPushV1, useSystemConfigControllerTestSmsV1 } from '#/.generated/api/endpoints/system-configs/system-configs';
import { type DeliveryConfigDto, type KakaoMessengerDetailsDtoAgency, type MessengerConfigDtoProvider, type PushConfigDtoProvider, type SmsConfigDtoProvider } from '#/.generated/api/model';
import { Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '#/.generated/shadcn/components/ui';
import { FormLayout, useAppForm } from '#/components/form';
import { SectionCard } from '#/components/layout';

export interface DeliveryTabHandle {
  submitData: () => Promise<DeliveryConfigDto | null>
}

export interface DeliveryTabProps {
  delivery?: Partial<DeliveryConfigDto>
}

const smsProviderOptions: Array<{ label: string, value: SmsConfigDtoProvider }> = [
  { label: 'NHN Cloud SMS', value: 'NHN_SMS' },
  { label: '솔라피', value: 'SOLAPI_SMS' },
  { label: '알리고', value: 'ALIGO_SMS' },
];

const pushProviderOptions: Array<{ label: string, value: PushConfigDtoProvider }> = [
  { label: 'Firebase Cloud Messaging', value: 'FCM' },
  { label: 'NHN Cloud Push', value: 'NHN_PUSH' },
];

const messengerOptions: Array<{ label: string, value: MessengerConfigDtoProvider }> = [
  { label: '카카오 알림톡', value: 'KAKAO' },
  { label: '라인', value: 'LINE' },
  { label: '왓츠앱', value: 'WHATSAPP' },
  { label: '텔레그램', value: 'TELEGRAM' },
  { label: '위챗', value: 'WECHAT' },
];

const kakaoAgencyOptions: Array<{ label: string, value: KakaoMessengerDetailsDtoAgency }> = [
  { label: 'NHN Cloud', value: 'NHN_CLOUD' },
  { label: '솔라피', value: 'SOLAPI' },
  { label: '알리고', value: 'ALIGO' },
];

const directAgencyOptions: Array<{ label: string, value: string }> = [
  { label: '직접 연동', value: 'DIRECT' },
];

function getMessengerTestButtonLabel(provider: MessengerConfigDtoProvider, isPending: boolean): string {
  if (provider === 'KAKAO') return '테스트 불가';
  if (isPending) return '...';
  return '테스트 발송';
}

export const DeliveryTab = forwardRef<DeliveryTabHandle, DeliveryTabProps>(function DeliveryTab(
  { delivery }: DeliveryTabProps,
  ref,
) {
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
            appKey: '',
            secretKey: '',
          },
          solapi: {
            apiKey: '',
            apiSecret: '',
          },
          aligo: {
            userId: delivery?.messenger?.kakao?.aligo?.userId ?? '',
            apiKey: '',
          },
        },
        line: {
          channelId: delivery?.messenger?.line?.channelId ?? '',
          channelSecret: '',
          accessToken: '',
        },
        whatsapp: {
          phoneNumberId: delivery?.messenger?.whatsapp?.phoneNumberId ?? '',
          businessAccountId: delivery?.messenger?.whatsapp?.businessAccountId ?? '',
          accessToken: '',
        },
        telegram: {
          botToken: '',
          chatId: delivery?.messenger?.telegram?.chatId ?? '',
        },
        wechat: {
          appId: delivery?.messenger?.wechat?.appId ?? '',
          appSecret: '',
        },
      },
      sms: {
        enabled: delivery?.sms?.enabled ?? false,
        provider: delivery?.sms?.provider ?? 'NHN_SMS',
        nhn: {
          appKey: '',
          secretKey: '',
          senderPhone: delivery?.sms?.nhn?.senderPhone ?? '',
        },
        solapi: {
          apiKey: '',
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
          appKey: '',
          userAccessKeyId: '',
          secretAccessKey: '',
        },
      },
      testTargets: {
        sms: '',
        push: '',
        messenger: '',
      },
    },
  });

  useImperativeHandle(ref, () => ({
    submitData: async () => {
      const isValid = await deliveryForm.validateAllFields('submit');
      if (!isValid) {
        return null;
      }
      const { testTargets: _testTargets, ...config } = deliveryForm.state.values;
      return config;
    },
  }));

  const testEmailMutation = useSystemConfigControllerTestEmailV1();
  const testSmsMutation = useSystemConfigControllerTestSmsV1();
  const testPushMutation = useSystemConfigControllerTestPushV1();
  const testMessengerMutation = useSystemConfigControllerTestMessengerV1();

  const handleTestEmail = () => {
    const values = deliveryForm.state.values.email;
    const match = /^[^<]*<([^>]*)>/.exec(values.from);
    const recipient = match?.[1].trim() ?? values.from.trim();

    testEmailMutation.mutate({
      data: {
        to: recipient,
        config: values,
      },
    });
  };

  const handleTestSms = () => {
    const values = deliveryForm.state.values.sms;
    const to = deliveryForm.state.values.testTargets.sms.trim();
    if (!to) return;

    testSmsMutation.mutate({
      data: {
        to,
        config: values,
      },
    });
  };

  const handleTestPush = () => {
    const values = deliveryForm.state.values.push;
    const token = deliveryForm.state.values.testTargets.push.trim();
    if (!token) return;

    testPushMutation.mutate({
      data: {
        token,
        config: values,
      },
    });
  };

  const handleTestMessenger = () => {
    const values = deliveryForm.state.values.messenger;
    const recipient = deliveryForm.state.values.testTargets.messenger.trim();
    if (!recipient) return;

    testMessengerMutation.mutate({
      data: {
        recipient,
        config: values,
      },
    });
  };

  type DeliveryFieldName = Parameters<typeof deliveryForm.AppField>[0]['name'];
  const renderCredentialInput = (name: DeliveryFieldName, label: string, type?: 'password', placeholder?: string) => (
    <deliveryForm.AppField name={name}>
      {(field) => <field.Input label={label} type={type} placeholder={type ? '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.' : placeholder ?? label} disabled={!deliveryForm.state.values.messenger.enabled} />}
    </deliveryForm.AppField>
  );

  return (
    <deliveryForm.AppForm>
      <FormLayout
        id="delivery-form"
        onSubmit={() => void deliveryForm.handleSubmit()}
        className="flex flex-col gap-6"
      >
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="mail"
          title="이메일"
          description="표준 SMTP 프로토콜을 통해 메일 서버와 연동합니다."
        >
          <SectionCard.Content className="grid grid-cols-2 gap-2">
            <div className="
              relative col-span-full flex items-center gap-2 pr-30
            "
            >
              <deliveryForm.AppField name="email.from">
                {(field) => (
                  <field.Input
                    label="기본 발신자 명칭 및 주소"
                    placeholder="Service Factory <noreply@example.com>"
                  />
                )}
              </deliveryForm.AppField>
              <Button
                type="button"
                variant="outline"
                size="default"
                className="anchor-position-[--email-from] ml-2"
                disabled={testEmailMutation.isPending}
                onClick={handleTestEmail}
              >
                <Send className="size-3.5 mr-1.5" />
                {testEmailMutation.isPending ? '...' : '테스트 발송'}
              </Button>
            </div>

            <div className="
              relative col-span-full flex items-center gap-2 pr-30
            "
            >
              <deliveryForm.AppField name="email.smtp.host">
                {(field) => <field.Input label="SMTP 호스트 서버 주소" placeholder="smtp.gmail.com / email-smtp.amazonaws.com" autoComplete="url" />}
              </deliveryForm.AppField>
              <deliveryForm.AppField name="email.smtp.port">
                {(field) => (
                  <div className="w-20 shrink-0">
                    <field.Input
                      type="number"
                      label="SMTP 포트"
                      placeholder="587"
                    />
                  </div>
                )}
              </deliveryForm.AppField>
              <div className="anchor-position-[--email-smtp-port] ml-2">
                <deliveryForm.AppField name="email.smtp.secure">
                  {(field) => <field.Switch showError={false} label="보안 연결" />}
                </deliveryForm.AppField>
              </div>
            </div>

            <div className="
              relative col-span-full flex flex-col
              md:flex-row
              gap-2
            "
            >
              <deliveryForm.AppField name="email.smtp.user">
                {(field) => <field.Input label="SMTP 인증 계정" placeholder="user@example.com / SMTP Username" autoComplete="username" />}
              </deliveryForm.AppField>
              <deliveryForm.AppField name="email.smtp.pass">
                {(field) => <field.Input type="password" label="SMTP 인증 비밀번호" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." autoComplete="new-password" />}
              </deliveryForm.AppField>
            </div>
          </SectionCard.Content>
        </SectionCard>

        <SectionCard
          variant="ghost"
          textSize="base"
          icon="message-circle"
          title="비즈니스 메신저"
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

          <SectionCard.Content className="grid grid-cols-2 gap-2">
            <deliveryForm.AppField name="messenger.enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <>
                    <div className="
                      relative col-span-full flex items-center gap-2 pr-30
                    "
                    >
                      <deliveryForm.AppField name="messenger.provider">
                        {(field) => (
                          <field.Select
                            label="메신저 종류"
                            placeholder="메신저 종류를 선택해 주세요"
                            options={messengerOptions}
                            disabled={!isEnabled}

                          />
                        )}
                      </deliveryForm.AppField>
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

                                  />
                                )}
                              </deliveryForm.AppField>
                            );
                          }
                          return (
                            <>
                              <Label className="
                                flex-none whitespace-nowrap select-none
                                justify-self-start
                              "
                              >
                                발송 대행사
                              </Label>
                              <Select disabled={!isEnabled} value="DIRECT" items={directAgencyOptions}>
                                <SelectTrigger
                                  className="
                                    w-full
                                    [anchor-name:--messenger-kakao-agency]
                                  "
                                  disabled={!isEnabled}
                                >
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
                            </>
                          );
                        }}
                      </deliveryForm.AppField>

                      <deliveryForm.AppField name="messenger.provider">
                        {(providerField) => (
                          <deliveryForm.AppField name="testTargets.messenger">
                            {(recipientField) => (
                              <Button
                                type="button"
                                variant="outline"
                                size="default"
                                className="
                                  anchor-position-[--messenger-kakao-agency]
                                  ml-2
                                "
                                disabled={!isEnabled || providerField.state.value === 'KAKAO' || testMessengerMutation.isPending || !recipientField.state.value.trim()}
                                onClick={handleTestMessenger}
                              >
                                <Send className="size-3.5 mr-1.5" />
                                {getMessengerTestButtonLabel(providerField.state.value, testMessengerMutation.isPending)}
                              </Button>
                            )}
                          </deliveryForm.AppField>
                        )}
                      </deliveryForm.AppField>
                    </div>

                    <div className="col-span-full">
                      <deliveryForm.AppField name="testTargets.messenger">
                        {(field) => <field.Input label="테스트 수신자 ID" placeholder="LINE 사용자 ID, WhatsApp 전화번호 또는 Telegram Chat ID" disabled={!isEnabled} />}
                      </deliveryForm.AppField>
                    </div>

                    <div className="col-span-full grid grid-cols-2 gap-2">
                      <deliveryForm.AppField name="messenger.provider">
                        {(providerField) => {
                          const provider = providerField.state.value;
                          return (
                            <>
                              {provider === 'KAKAO' && (
                                <>

                                  <deliveryForm.AppField name="messenger.kakao.plusFriendId">
                                    {(field) => <field.Input label="카카오 채널 ID" placeholder="@service_factory" disabled={!isEnabled} />}
                                  </deliveryForm.AppField>

                                  <deliveryForm.AppField name="messenger.kakao.senderKey">
                                    {(field) => <field.Input label="발신 프로필 키" placeholder="sender-key-1234..." disabled={!isEnabled} />}
                                  </deliveryForm.AppField>

                                </>
                              )}
                              {provider === 'LINE' && (

                                <deliveryForm.AppField name="messenger.line.channelId">{(field) => <field.Input label="LINE Channel ID" placeholder="LINE Channel ID" disabled={!isEnabled} />}</deliveryForm.AppField>

                              )}
                              {provider === 'WHATSAPP' && (

                                <deliveryForm.AppField name="messenger.whatsapp.phoneNumberId">{(field) => <field.Input label="Phone Number ID" placeholder="Phone Number ID" disabled={!isEnabled} />}</deliveryForm.AppField>

                              )}
                              {provider === 'TELEGRAM' && (

                                <deliveryForm.AppField name="messenger.telegram.chatId">{(field) => <field.Input label="기본 Chat ID" placeholder="-1001234567890" disabled={!isEnabled} />}</deliveryForm.AppField>

                              )}
                              {provider === 'WECHAT' && (

                                <deliveryForm.AppField name="messenger.wechat.appId">{(field) => <field.Input label="WeChat Official AppID" placeholder="WeChat Official AppID" disabled={!isEnabled} />}</deliveryForm.AppField>

                              )}
                            </>
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
                                  if (currentAgency === 'NHN_CLOUD') return (
                                    <>
                                      {renderCredentialInput('messenger.kakao.nhn.appKey', 'NHN Cloud AppKey', undefined, 'NHN Cloud 알림톡 AppKey')}
                                      {renderCredentialInput('messenger.kakao.nhn.secretKey', 'NHN Cloud SecretKey', 'password')}
                                    </>
                                  );
                                  if (currentAgency === 'SOLAPI') return (
                                    <>
                                      {renderCredentialInput('messenger.kakao.solapi.apiKey', '솔라피 API Key')}
                                      {renderCredentialInput('messenger.kakao.solapi.apiSecret', '솔라피 API Secret', 'password')}
                                    </>
                                  );
                                  if (currentAgency === 'ALIGO') return (
                                    <>
                                      {renderCredentialInput('messenger.kakao.aligo.userId', '알리고 사용자 ID')}
                                      {renderCredentialInput('messenger.kakao.aligo.apiKey', '알리고 API Key', 'password')}
                                    </>
                                  );
                                  return null;
                                }}
                              </deliveryForm.AppField>
                            );
                          }
                          if (current === 'LINE') return (
                            <>
                              <deliveryForm.AppField name="messenger.line.channelSecret">{(field) => <field.Input type="password" label="LINE Channel Secret" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</deliveryForm.AppField>
                              <deliveryForm.AppField name="messenger.line.accessToken">{(field) => <field.Input type="password" label="Channel Access Token" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</deliveryForm.AppField>
                            </>
                          );
                          if (current === 'WHATSAPP') return (
                            <>
                              <deliveryForm.AppField name="messenger.whatsapp.businessAccountId">{(field) => <field.Input label="Business Account ID" placeholder="Business Account ID" disabled={!isEnabled} />}</deliveryForm.AppField>
                              <deliveryForm.AppField name="messenger.whatsapp.accessToken">{(field) => <field.Input type="password" label="System User Access Token" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</deliveryForm.AppField>
                            </>
                          );
                          if (current === 'TELEGRAM') return <deliveryForm.AppField name="messenger.telegram.botToken">{(field) => <field.Input type="password" label="Telegram Bot Token" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</deliveryForm.AppField>;
                          if (current === 'WECHAT') return <deliveryForm.AppField name="messenger.wechat.appSecret">{(field) => <field.Input type="password" label="WeChat AppSecret" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</deliveryForm.AppField>;
                          return null;
                        }}
                      </deliveryForm.AppField>
                    </div>
                  </>
                );
              }}
            </deliveryForm.AppField>
          </SectionCard.Content>
        </SectionCard>

        <SectionCard
          variant="ghost"
          textSize="base"
          icon="phone"
          title="SMS 문자"
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

          <SectionCard.Content className="grid grid-cols-2 gap-2">
            <deliveryForm.AppField name="sms.enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <>
                    <div className="
                      relative col-span-full flex items-center gap-2 pr-30
                    "
                    >
                      <deliveryForm.AppField name="sms.provider">
                        {(field) => (
                          <field.Select
                            label="SMS 대행사"
                            placeholder="SMS 대행사를 선택해 주세요"
                            options={smsProviderOptions}
                            disabled={!isEnabled}

                          />
                        )}
                      </deliveryForm.AppField>
                      <deliveryForm.AppField name="testTargets.sms">
                        {(field) => (
                          <Button
                            type="button"
                            variant="outline"
                            size="default"
                            className="anchor-position-[--sms-provider] ml-2"
                            disabled={!isEnabled || testSmsMutation.isPending || !field.state.value.trim()}
                            onClick={handleTestSms}
                          >
                            <Send className="size-3.5 mr-1.5" />
                            {testSmsMutation.isPending ? '...' : '테스트 발송'}
                          </Button>
                        )}
                      </deliveryForm.AppField>
                    </div>
                    <div className="col-span-full">
                      <deliveryForm.AppField name="testTargets.sms">
                        {(field) => <field.Input type="tel" label="테스트 수신 전화번호" placeholder="01012345678" disabled={!isEnabled} />}
                      </deliveryForm.AppField>
                    </div>
                    <div className="col-span-full grid grid-cols-2 gap-2">
                      <deliveryForm.AppField name="sms.provider">
                        {(providerField) => {
                          const provider = providerField.state.value;
                          if (provider === 'ALIGO_SMS') return <deliveryForm.AppField name="sms.aligo.sender">{(field) => <field.Input label="사전 등록 발신번호" placeholder="1588-0000" disabled={!isEnabled} />}</deliveryForm.AppField>;
                          if (provider === 'SOLAPI_SMS') return <deliveryForm.AppField name="sms.solapi.senderPhone">{(field) => <field.Input label="사전 등록 발신번호" placeholder="1588-0000" disabled={!isEnabled} />}</deliveryForm.AppField>;
                          return <deliveryForm.AppField name="sms.nhn.senderPhone">{(field) => <field.Input label="사전 등록 발신번호" placeholder="1588-0000" disabled={!isEnabled} />}</deliveryForm.AppField>;
                        }}
                      </deliveryForm.AppField>
                      <deliveryForm.AppField name="sms.provider">
                        {(providerField) => {
                          const current = providerField.state.value;
                          if (current === 'NHN_SMS') return (
                            <>
                              <deliveryForm.AppField name="sms.nhn.appKey">{(field) => <field.Input label="NHN Cloud AppKey" placeholder="NHN Cloud SMS AppKey" disabled={!isEnabled} />}</deliveryForm.AppField>
                              <deliveryForm.AppField name="sms.nhn.secretKey">{(field) => <field.Input type="password" label="NHN Cloud SecretKey" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</deliveryForm.AppField>
                            </>
                          );
                          if (current === 'SOLAPI_SMS') return (
                            <>
                              <deliveryForm.AppField name="sms.solapi.apiKey">{(field) => <field.Input label="솔라피 API Key" placeholder="솔라피 API Key" disabled={!isEnabled} />}</deliveryForm.AppField>
                              <deliveryForm.AppField name="sms.solapi.apiSecret">{(field) => <field.Input type="password" label="솔라피 API Secret" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</deliveryForm.AppField>
                            </>
                          );
                          if (current === 'ALIGO_SMS') return (
                            <>
                              <deliveryForm.AppField name="sms.aligo.userId">{(field) => <field.Input label="알리고 사용자 ID" placeholder="알리고 사용자 ID" disabled={!isEnabled} />}</deliveryForm.AppField>
                              <deliveryForm.AppField name="sms.aligo.apiKey">{(field) => <field.Input type="password" label="알리고 API Key" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</deliveryForm.AppField>
                            </>
                          );
                          return null;
                        }}
                      </deliveryForm.AppField>
                    </div>
                  </>
                );
              }}
            </deliveryForm.AppField>
          </SectionCard.Content>
        </SectionCard>

        {/* 4. 푸시 알림 설정 */}
        <SectionCard
          variant="ghost"
          textSize="base"
          icon="bell"
          title="Push 알림"
          description="푸시 메시지 전송을 위한 프로젝트 연동 정보를 설정합니다."
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

          <SectionCard.Content className="grid grid-cols-2 gap-2">
            <deliveryForm.AppField name="push.enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <>
                    <div className="
                      relative col-span-full flex items-center gap-2 pr-30
                    "
                    >
                      <deliveryForm.AppField name="push.provider">
                        {(field) => (
                          <field.Select
                            label="푸시 알림 제공자"
                            placeholder="푸시 알림 제공자를 선택해 주세요"
                            options={pushProviderOptions}
                            disabled={!isEnabled}

                          />
                        )}
                      </deliveryForm.AppField>
                      <deliveryForm.AppField name="testTargets.push">
                        {(field) => (
                          <Button
                            type="button"
                            variant="outline"
                            size="default"
                            className="anchor-position-[--push-provider] ml-2"
                            disabled={!isEnabled || testPushMutation.isPending || !field.state.value.trim()}
                            onClick={handleTestPush}
                          >
                            <Send className="size-3.5 mr-1.5" />
                            {testPushMutation.isPending ? '...' : '테스트 발송'}
                          </Button>
                        )}
                      </deliveryForm.AppField>
                    </div>
                    <div className="col-span-full">
                      <deliveryForm.AppField name="testTargets.push">
                        {(field) => <field.Input label="테스트 기기 토큰" placeholder="FCM registration token 또는 NHN UID" disabled={!isEnabled} />}
                      </deliveryForm.AppField>
                    </div>
                    <div className="col-span-full grid grid-cols-2 gap-2">
                      <deliveryForm.AppField name="push.provider">
                        {(providerField) => {
                          const current = providerField.state.value;
                          if (current === 'FCM') return (
                            <>
                              <deliveryForm.AppField name="push.fcm.projectId">{(field) => <field.Input label="Firebase Project ID" placeholder="service-factory-app" disabled={!isEnabled} />}</deliveryForm.AppField>
                              <deliveryForm.AppField name="push.fcm.clientEmail">{(field) => <field.Input label="FCM 서비스 계정 이메일" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</deliveryForm.AppField>
                            </>
                          );
                          if (current === 'NHN_PUSH') return (
                            <>
                              <deliveryForm.AppField name="push.nhn.appKey">{(field) => <field.Input label="NHN Cloud Push AppKey" placeholder="NHN Cloud Push AppKey" disabled={!isEnabled} />}</deliveryForm.AppField>
                              <deliveryForm.AppField name="push.nhn.userAccessKeyId">{(field) => <field.Input label="NHN Cloud User Access Key ID" placeholder="User Access Key ID" disabled={!isEnabled} />}</deliveryForm.AppField>
                              <deliveryForm.AppField name="push.nhn.secretAccessKey">{(field) => <field.Input type="password" label="NHN Cloud Secret Access Key" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</deliveryForm.AppField>
                            </>
                          );
                          return null;
                        }}
                      </deliveryForm.AppField>
                    </div>
                  </>
                );
              }}
            </deliveryForm.AppField>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </deliveryForm.AppForm>
  );
});
