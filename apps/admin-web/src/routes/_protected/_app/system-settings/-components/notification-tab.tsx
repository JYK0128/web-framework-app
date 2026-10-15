import { FormLayout, useAppForm } from '@pkg/web-core/form';
import { SectionCard } from '@pkg/web-core/template';
import { Send } from 'lucide-react';
import { forwardRef, useImperativeHandle } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { useSystemConfigControllerTestEmailV1, useSystemConfigControllerTestMessengerV1, useSystemConfigControllerTestPushV1, useSystemConfigControllerTestSmsV1 } from '#/.generated/api/endpoints/system-configs/system-configs';
import { type KakaoMessengerDetailsDtoAgency, type MessengerConfigDtoProvider, type NotificationConfigDto, type PushConfigDtoProvider, type SmsConfigDtoProvider } from '#/.generated/api/model';
import { SystemConfigControllerTestMessengerV1Body } from '#/.generated/api/zod/system-configs/system-configs';
import { Button, Label, Switch } from '#/.generated/shadcn/components/ui';

export interface NotificationTabHandle {
  submitData: () => Promise<NotificationConfigDto | null | undefined>
}

export interface NotificationTabProps {
  notification?: Partial<NotificationConfigDto>
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

function getMessengerTestButtonLabel(isPending: boolean): string {
  if (isPending) return '...';
  return '테스트 발송';
}

const jsonInput = z.string().transform((value, context) => {
  try {
    return JSON.parse(value) as unknown;
  }
  catch {
    context.addIssue({ code: 'custom', message: 'JSON 형식이 올바르지 않습니다.' });
    return z.NEVER;
  }
});
const alimtalkSchema = SystemConfigControllerTestMessengerV1Body.shape.alimtalk.unwrap();
const variablesSchema = jsonInput.pipe(alimtalkSchema.shape.variables.unwrap());
const buttonsSchema = jsonInput.pipe(alimtalkSchema.shape.buttons.unwrap());

export const NotificationTab = forwardRef<NotificationTabHandle, NotificationTabProps>(function NotificationTab(
  { notification }: NotificationTabProps,
  ref,
) {
  const notificationForm = useAppForm({
    defaultValues: {
      email: {
        from: notification?.email?.from ?? '',
        smtp: {
          host: notification?.email?.smtp?.host ?? '',
          port: notification?.email?.smtp?.port,
          secure: notification?.email?.smtp?.secure,
          user: notification?.email?.smtp?.user ?? '',
          pass: '',
        },
      },
      messenger: {
        enabled: notification?.messenger?.enabled ?? false,
        provider: notification?.messenger?.provider ?? 'KAKAO',
        kakao: {
          plusFriendId: notification?.messenger?.kakao?.plusFriendId ?? '',
          senderKey: notification?.messenger?.kakao?.senderKey ?? '',
          agency: notification?.messenger?.kakao?.agency,
          nhn: {
            appKey: '',
            secretKey: '',
          },
          solapi: {
            apiKey: '',
            apiSecret: '',
          },
          aligo: {
            userId: notification?.messenger?.kakao?.aligo?.userId ?? '',
            apiKey: '',
          },
        },
        line: {
          channelId: notification?.messenger?.line?.channelId ?? '',
          channelSecret: '',
          accessToken: '',
        },
        whatsapp: {
          phoneNumberId: notification?.messenger?.whatsapp?.phoneNumberId ?? '',
          businessAccountId: notification?.messenger?.whatsapp?.businessAccountId ?? '',
          accessToken: '',
        },
        telegram: {
          botToken: '',
          chatId: notification?.messenger?.telegram?.chatId ?? '',
        },
        wechat: {
          appId: notification?.messenger?.wechat?.appId ?? '',
          appSecret: '',
        },
      },
      sms: {
        enabled: notification?.sms?.enabled ?? false,
        provider: notification?.sms?.provider ?? 'NHN_SMS',
        nhn: {
          appKey: '',
          secretKey: '',
          senderPhone: notification?.sms?.nhn?.senderPhone ?? '',
        },
        solapi: {
          apiKey: '',
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
        provider: notification?.push?.provider ?? 'FCM',
        fcm: {
          projectId: notification?.push?.fcm?.projectId ?? '',
          clientEmail: notification?.push?.fcm?.clientEmail ?? '',
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
        alimtalk: { templateCode: '', content: '', title: '', sender: '', pfId: '', variables: '{}', buttons: '[]' },
      },
    },
  });

  useImperativeHandle(ref, () => ({
    submitData: async () => {
      if (!notificationForm.state.isDirty) return undefined;
      const isValid = await notificationForm.validateAllFields('submit');
      if (!isValid) {
        return null;
      }
      const { testTargets: _testTargets, ...config } = notificationForm.state.values;
      return config;
    },
  }));

  const testEmailMutation = useSystemConfigControllerTestEmailV1();
  const testSmsMutation = useSystemConfigControllerTestSmsV1();
  const testPushMutation = useSystemConfigControllerTestPushV1();
  const testMessengerMutation = useSystemConfigControllerTestMessengerV1();

  const handleTestEmail = () => {
    const values = notificationForm.state.values.email;
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
    const values = notificationForm.state.values.sms;
    const to = notificationForm.state.values.testTargets.sms.trim();
    if (!to) return;

    testSmsMutation.mutate({
      data: {
        to,
        config: values,
      },
    });
  };

  const handleTestPush = () => {
    const values = notificationForm.state.values.push;
    const token = notificationForm.state.values.testTargets.push.trim();
    if (!token) return;

    testPushMutation.mutate({
      data: {
        token,
        config: values,
      },
    });
  };

  const handleTestMessenger = async () => {
    const values = notificationForm.state.values.messenger;
    const recipient = notificationForm.state.values.testTargets.messenger.trim();
    if (!recipient) return;

    if (values.provider !== 'KAKAO') {
      testMessengerMutation.mutate({ data: { recipient, config: values } });
      return;
    }

    const test = notificationForm.state.values.testTargets.alimtalk;
    try {
      await Promise.all([
        notificationForm.validateField('testTargets.alimtalk.variables', 'change'),
        notificationForm.validateField('testTargets.alimtalk.buttons', 'change'),
      ]);
      const variables = variablesSchema.safeParse(test.variables);
      const buttons = buttonsSchema.safeParse(test.buttons);
      if (!variables.success || !buttons.success) return;

      testMessengerMutation.mutate({
        data: {
          recipient,
          config: values,
          alimtalk: {
            templateCode: test.templateCode,
            content: test.content,
            title: test.title || undefined,
            sender: test.sender || undefined,
            pfId: test.pfId || undefined,
            variables: variables.data,
            buttons: buttons.data,
          },
        },
      });
    }
    catch {
      toast.error('알림톡 테스트 입력 검증 중 오류가 발생했습니다.');
    }
  };

  type NotificationFieldName = Parameters<typeof notificationForm.AppField>[0]['name'];
  const renderCredentialInput = (name: NotificationFieldName, label: string, type?: 'password', placeholder?: string) => (
    <notificationForm.AppField name={name}>
      {(field) => <field.Input label={label} type={type} placeholder={type ? '비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다.' : placeholder ?? label} disabled={!notificationForm.state.values.messenger.enabled} />}
    </notificationForm.AppField>
  );

  return (
    <notificationForm.AppForm>
      <FormLayout
        id="notification-form"
        onSubmit={() => void notificationForm.handleSubmit()}
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
              <notificationForm.AppField name="email.from">
                {(field) => (
                  <field.Input
                    label="기본 발신자 명칭 및 주소"
                    placeholder="Service Factory <noreply@example.com>"
                  />
                )}
              </notificationForm.AppField>
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
              <notificationForm.AppField name="email.smtp.host">
                {(field) => <field.Input label="SMTP 호스트 서버 주소" placeholder="smtp.gmail.com / email-smtp.amazonaws.com" autoComplete="url" />}
              </notificationForm.AppField>
              <notificationForm.AppField name="email.smtp.port">
                {(field) => (
                  <div className="w-20 shrink-0">
                    <field.Input
                      type="number"
                      label="SMTP 포트"
                      placeholder="587"
                    />
                  </div>
                )}
              </notificationForm.AppField>
              <div className="anchor-position-[--email-smtp-port] ml-2">
                <notificationForm.AppField name="email.smtp.secure">
                  {(field) => <field.Switch showError={false} label="보안 연결" />}
                </notificationForm.AppField>
              </div>
            </div>

            <div className="
              relative col-span-full flex flex-col
              md:flex-row
              gap-2
            "
            >
              <notificationForm.AppField name="email.smtp.user">
                {(field) => <field.Input label="SMTP 인증 계정" placeholder="user@example.com / SMTP Username" autoComplete="username" />}
              </notificationForm.AppField>
              <notificationForm.AppField name="email.smtp.pass">
                {(field) => <field.Input type="password" label="SMTP 인증 비밀번호" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." autoComplete="new-password" />}
              </notificationForm.AppField>
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
            <notificationForm.AppField name="messenger.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label="비즈니스 메신저 발송 활성화"
                />
              )}
            </notificationForm.AppField>
          </SectionCard.Actions>

          <SectionCard.Content className="grid grid-cols-2 gap-2">
            <notificationForm.AppField name="messenger.enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <>
                    <div className="
                      relative col-span-full flex items-center gap-2 pr-30
                    "
                    >
                      <notificationForm.AppField name="messenger.provider">
                        {(field) => (
                          <field.Select
                            label="메신저 종류"
                            placeholder="메신저 종류를 선택해 주세요"
                            options={messengerOptions}
                            disabled={!isEnabled}

                          />
                        )}
                      </notificationForm.AppField>
                      <notificationForm.AppField name="messenger.provider">
                        {(providerField) => {
                          const currentProvider = providerField.state.value;
                          if (currentProvider === 'KAKAO') {
                            return (
                              <notificationForm.AppField name="messenger.kakao.agency">
                                {(agencyField) => (
                                  <agencyField.Select
                                    label="발송 대행사"
                                    options={kakaoAgencyOptions}
                                    disabled={!isEnabled}

                                  />
                                )}
                              </notificationForm.AppField>
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
                              <div
                                aria-disabled={!isEnabled}
                                className="
                                  flex h-8 w-full min-w-0 items-center truncate
                                  rounded-lg border border-input px-2.5 text-sm
                                  anchor-name-[--messenger-kakao-agency]
                                "
                              >
                                직접 연동
                              </div>
                            </>
                          );
                        }}
                      </notificationForm.AppField>

                      <notificationForm.AppField name="testTargets.messenger">
                        {(recipientField) => (
                          <Button
                            type="button"
                            variant="outline"
                            size="default"
                            className="
                              anchor-position-[--messenger-kakao-agency] ml-2
                            "
                            disabled={!isEnabled || testMessengerMutation.isPending || !recipientField.state.value.trim()}
                            onClick={() => void handleTestMessenger()}
                          >
                            <Send className="size-3.5 mr-1.5" />
                            {getMessengerTestButtonLabel(testMessengerMutation.isPending)}
                          </Button>
                        )}
                      </notificationForm.AppField>
                    </div>

                    <div className="col-span-full">
                      <notificationForm.AppField name="testTargets.messenger">
                        {(field) => <field.Input label="테스트 수신자" placeholder="카카오·WhatsApp 전화번호, LINE 사용자 ID 또는 Telegram Chat ID" disabled={!isEnabled} />}
                      </notificationForm.AppField>
                    </div>

                    <div className="col-span-full grid grid-cols-2 gap-2">
                      <notificationForm.AppField name="messenger.provider">
                        {(providerField) => {
                          const provider = providerField.state.value;
                          return (
                            <>
                              {provider === 'KAKAO' && (
                                <>

                                  <notificationForm.AppField name="testTargets.alimtalk.templateCode">
                                    {(field) => <field.Input label="테스트 템플릿 코드" placeholder="승인된 코드 (SOLAPI: templateId)" disabled={!isEnabled} />}
                                  </notificationForm.AppField>
                                  <notificationForm.AppField name="testTargets.alimtalk.pfId">
                                    {(field) => <field.Input label="SOLAPI pfId (선택)" placeholder="미입력 시 발신 프로필 키 사용" disabled={!isEnabled} />}
                                  </notificationForm.AppField>
                                  <div className="col-span-full">
                                    <notificationForm.AppField name="testTargets.alimtalk.content">
                                      {(field) => <field.Textarea label="테스트 승인 본문" placeholder="승인 원문과 줄바꿈을 그대로 입력하세요. #{이름} 변수 지원" disabled={!isEnabled} />}
                                    </notificationForm.AppField>
                                  </div>
                                  <notificationForm.AppField name="testTargets.alimtalk.variables" validators={{ onChange: ({ value }) => variablesSchema.safeParse(value).success ? undefined : '문자열 값의 JSON 객체를 입력하세요.' }}>
                                    {(field) => <field.Textarea label="테스트 변수 JSON" placeholder={'{"이름":"홍길동"}'} disabled={!isEnabled} />}
                                  </notificationForm.AppField>
                                  <notificationForm.AppField name="testTargets.alimtalk.buttons" validators={{ onChange: ({ value }) => buttonsSchema.safeParse(value).success ? undefined : '버튼 JSON 배열을 입력하세요. 최대 5개입니다.' }}>
                                    {(field) => <field.Textarea label="테스트 버튼 JSON" placeholder={'[{"type":"WL","name":"확인","linkMo":"https://example.com"}]'} disabled={!isEnabled} />}
                                  </notificationForm.AppField>
                                  <notificationForm.AppField name="testTargets.alimtalk.title">
                                    {(field) => <field.Input label="알리고 테스트 제목" disabled={!isEnabled} />}
                                  </notificationForm.AppField>
                                  <notificationForm.AppField name="testTargets.alimtalk.sender">
                                    {(field) => <field.Input label="알리고 테스트 발신번호" placeholder="사전 등록된 번호" disabled={!isEnabled} />}
                                  </notificationForm.AppField>
                                  <notificationForm.AppField name="messenger.kakao.plusFriendId">
                                    {(field) => <field.Input label="카카오 채널 ID" placeholder="@service_factory" disabled={!isEnabled} />}
                                  </notificationForm.AppField>

                                  <notificationForm.AppField name="messenger.kakao.senderKey">
                                    {(field) => <field.Input label="발신 프로필 키" placeholder="sender-key-1234..." disabled={!isEnabled} />}
                                  </notificationForm.AppField>

                                </>
                              )}
                              {provider === 'LINE' && (

                                <notificationForm.AppField name="messenger.line.channelId">{(field) => <field.Input label="LINE Channel ID" placeholder="LINE Channel ID" disabled={!isEnabled} />}</notificationForm.AppField>

                              )}
                              {provider === 'WHATSAPP' && (

                                <notificationForm.AppField name="messenger.whatsapp.phoneNumberId">{(field) => <field.Input label="Phone Number ID" placeholder="Phone Number ID" disabled={!isEnabled} />}</notificationForm.AppField>

                              )}
                              {provider === 'TELEGRAM' && (

                                <notificationForm.AppField name="messenger.telegram.chatId">{(field) => <field.Input label="기본 Chat ID" placeholder="-1001234567890" disabled={!isEnabled} />}</notificationForm.AppField>

                              )}
                              {provider === 'WECHAT' && (

                                <notificationForm.AppField name="messenger.wechat.appId">{(field) => <field.Input label="WeChat Official AppID" placeholder="WeChat Official AppID" disabled={!isEnabled} />}</notificationForm.AppField>

                              )}
                            </>
                          );
                        }}
                      </notificationForm.AppField>

                      <notificationForm.AppField name="messenger.provider">
                        {(providerField) => {
                          const current = providerField.state.value;
                          if (current === 'KAKAO') {
                            return (
                              <notificationForm.AppField name="messenger.kakao.agency">
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
                              </notificationForm.AppField>
                            );
                          }
                          if (current === 'LINE') return (
                            <>
                              <notificationForm.AppField name="messenger.line.channelSecret">{(field) => <field.Input type="password" label="LINE Channel Secret" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</notificationForm.AppField>
                              <notificationForm.AppField name="messenger.line.accessToken">{(field) => <field.Input type="password" label="Channel Access Token" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</notificationForm.AppField>
                            </>
                          );
                          if (current === 'WHATSAPP') return (
                            <>
                              <notificationForm.AppField name="messenger.whatsapp.businessAccountId">{(field) => <field.Input label="Business Account ID" placeholder="Business Account ID" disabled={!isEnabled} />}</notificationForm.AppField>
                              <notificationForm.AppField name="messenger.whatsapp.accessToken">{(field) => <field.Input type="password" label="System User Access Token" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</notificationForm.AppField>
                            </>
                          );
                          if (current === 'TELEGRAM') return <notificationForm.AppField name="messenger.telegram.botToken">{(field) => <field.Input type="password" label="Telegram Bot Token" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</notificationForm.AppField>;
                          if (current === 'WECHAT') return <notificationForm.AppField name="messenger.wechat.appSecret">{(field) => <field.Input type="password" label="WeChat AppSecret" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</notificationForm.AppField>;
                          return null;
                        }}
                      </notificationForm.AppField>
                    </div>
                  </>
                );
              }}
            </notificationForm.AppField>
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
            <notificationForm.AppField name="sms.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label="SMS 발송 활성화"
                />
              )}
            </notificationForm.AppField>
          </SectionCard.Actions>

          <SectionCard.Content className="grid grid-cols-2 gap-2">
            <notificationForm.AppField name="sms.enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <>
                    <div className="
                      relative col-span-full flex items-center gap-2 pr-30
                    "
                    >
                      <notificationForm.AppField name="sms.provider">
                        {(field) => (
                          <field.Select
                            label="SMS 대행사"
                            placeholder="SMS 대행사를 선택해 주세요"
                            options={smsProviderOptions}
                            disabled={!isEnabled}

                          />
                        )}
                      </notificationForm.AppField>
                      <notificationForm.AppField name="testTargets.sms">
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
                      </notificationForm.AppField>
                    </div>
                    <div className="col-span-full">
                      <notificationForm.AppField name="testTargets.sms">
                        {(field) => <field.Input type="tel" label="테스트 수신 전화번호" placeholder="01012345678" disabled={!isEnabled} />}
                      </notificationForm.AppField>
                    </div>
                    <div className="col-span-full grid grid-cols-2 gap-2">
                      <notificationForm.AppField name="sms.provider">
                        {(providerField) => {
                          const provider = providerField.state.value;
                          if (provider === 'ALIGO_SMS') return <notificationForm.AppField name="sms.aligo.sender">{(field) => <field.Input label="사전 등록 발신번호" placeholder="1588-0000" disabled={!isEnabled} />}</notificationForm.AppField>;
                          if (provider === 'SOLAPI_SMS') return <notificationForm.AppField name="sms.solapi.senderPhone">{(field) => <field.Input label="사전 등록 발신번호" placeholder="1588-0000" disabled={!isEnabled} />}</notificationForm.AppField>;
                          return <notificationForm.AppField name="sms.nhn.senderPhone">{(field) => <field.Input label="사전 등록 발신번호" placeholder="1588-0000" disabled={!isEnabled} />}</notificationForm.AppField>;
                        }}
                      </notificationForm.AppField>
                      <notificationForm.AppField name="sms.provider">
                        {(providerField) => {
                          const current = providerField.state.value;
                          if (current === 'NHN_SMS') return (
                            <>
                              <notificationForm.AppField name="sms.nhn.appKey">{(field) => <field.Input label="NHN Cloud AppKey" placeholder="NHN Cloud SMS AppKey" disabled={!isEnabled} />}</notificationForm.AppField>
                              <notificationForm.AppField name="sms.nhn.secretKey">{(field) => <field.Input type="password" label="NHN Cloud SecretKey" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</notificationForm.AppField>
                            </>
                          );
                          if (current === 'SOLAPI_SMS') return (
                            <>
                              <notificationForm.AppField name="sms.solapi.apiKey">{(field) => <field.Input label="솔라피 API Key" placeholder="솔라피 API Key" disabled={!isEnabled} />}</notificationForm.AppField>
                              <notificationForm.AppField name="sms.solapi.apiSecret">{(field) => <field.Input type="password" label="솔라피 API Secret" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</notificationForm.AppField>
                            </>
                          );
                          if (current === 'ALIGO_SMS') return (
                            <>
                              <notificationForm.AppField name="sms.aligo.userId">{(field) => <field.Input label="알리고 사용자 ID" placeholder="알리고 사용자 ID" disabled={!isEnabled} />}</notificationForm.AppField>
                              <notificationForm.AppField name="sms.aligo.apiKey">{(field) => <field.Input type="password" label="알리고 API Key" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</notificationForm.AppField>
                            </>
                          );
                          return null;
                        }}
                      </notificationForm.AppField>
                    </div>
                  </>
                );
              }}
            </notificationForm.AppField>
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
            <notificationForm.AppField name="push.enabled">
              {(field) => (
                <Switch
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                  aria-label="푸시 알림 활성화"
                />
              )}
            </notificationForm.AppField>
          </SectionCard.Actions>

          <SectionCard.Content className="grid grid-cols-2 gap-2">
            <notificationForm.AppField name="push.enabled">
              {(enabledField) => {
                const isEnabled = enabledField.state.value;
                return (
                  <>
                    <div className="
                      relative col-span-full flex items-center gap-2 pr-30
                    "
                    >
                      <notificationForm.AppField name="push.provider">
                        {(field) => (
                          <field.Select
                            label="푸시 알림 제공자"
                            placeholder="푸시 알림 제공자를 선택해 주세요"
                            options={pushProviderOptions}
                            disabled={!isEnabled}

                          />
                        )}
                      </notificationForm.AppField>
                      <notificationForm.AppField name="testTargets.push">
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
                      </notificationForm.AppField>
                    </div>
                    <div className="col-span-full">
                      <notificationForm.AppField name="testTargets.push">
                        {(field) => <field.Input label="테스트 기기 토큰" placeholder="FCM registration token 또는 NHN UID" disabled={!isEnabled} />}
                      </notificationForm.AppField>
                    </div>
                    <div className="col-span-full grid grid-cols-2 gap-2">
                      <notificationForm.AppField name="push.provider">
                        {(providerField) => {
                          const current = providerField.state.value;
                          if (current === 'FCM') return (
                            <>
                              <notificationForm.AppField name="push.fcm.projectId">{(field) => <field.Input label="Firebase Project ID" placeholder="service-factory-app" disabled={!isEnabled} />}</notificationForm.AppField>
                              <notificationForm.AppField name="push.fcm.clientEmail">{(field) => <field.Input label="FCM 서비스 계정 이메일" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</notificationForm.AppField>
                            </>
                          );
                          if (current === 'NHN_PUSH') return (
                            <>
                              <notificationForm.AppField name="push.nhn.appKey">{(field) => <field.Input label="NHN Cloud Push AppKey" placeholder="NHN Cloud Push AppKey" disabled={!isEnabled} />}</notificationForm.AppField>
                              <notificationForm.AppField name="push.nhn.userAccessKeyId">{(field) => <field.Input label="NHN Cloud User Access Key ID" placeholder="User Access Key ID" disabled={!isEnabled} />}</notificationForm.AppField>
                              <notificationForm.AppField name="push.nhn.secretAccessKey">{(field) => <field.Input type="password" label="NHN Cloud Secret Access Key" placeholder="비밀번호 변경 시에만 입력하세요. 미입력 시 기존 비밀번호가 유지됩니다." disabled={!isEnabled} />}</notificationForm.AppField>
                            </>
                          );
                          return null;
                        }}
                      </notificationForm.AppField>
                    </div>
                  </>
                );
              }}
            </notificationForm.AppField>
          </SectionCard.Content>
        </SectionCard>
      </FormLayout>
    </notificationForm.AppForm>
  );
});
