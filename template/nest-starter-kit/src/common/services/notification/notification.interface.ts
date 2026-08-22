export enum NotificationChannelType {
  SMS = 'SMS',
  KAKAO = 'KAKAO',
  MESSENGER = 'MESSENGER',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

export type NotificationEmailProviderType = 'smtp' | 'nhn';
export type NotificationSmsProviderType = 'nhn';
export type NotificationKakaoProviderType = 'nhn';
export type NotificationMessengerProviderType = 'slack' | 'discord';

export interface NotificationModuleOptions {
  /** 이메일 발송 공급자 선택 (기본값: 'smtp') */
  emailProvider?: NotificationEmailProviderType
  /** SMS 발송 공급자 선택 (기본값: 'nhn') */
  smsProvider?: NotificationSmsProviderType
  /** 카카오 알림톡 공급자 선택 (기본값: 'nhn') */
  kakaoProvider?: NotificationKakaoProviderType
  /** 기본 메신저 공급자 선택 (기본값: 'slack') */
  defaultMessenger?: NotificationMessengerProviderType
}

export interface NotificationRecipient {
  userId?: string
  phone?: string
  email?: string
  webhookUrl?: string
  slackWebhookUrl?: string
  pushToken?: string
}

export interface NotificationPayload {
  recipient: NotificationRecipient
  title?: string
  message: string
  /** 템플릿 기반 발송 시 템플릿 식별자 (예: 알림톡 템플릿 코드 등) */
  templateId?: string
  /** 템플릿 변수 치환용 인자 */
  templateArgs?: Record<string, string | number>
  /** 이메일 발송 시 HTML 본문 */
  html?: string
  /** 상세 메타데이터 (sections, fields 등) */
  metadata?: Record<string, unknown>
}

/**
 * 모든 Provider(SMS, Email, Kakao, Messenger 등)의 공통 반환 결과 규격
 */
export interface NotificationProviderResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * NotificationService에서 채널 발송 후 반환하는 결과 규격
 */
export interface NotificationSendResult extends NotificationProviderResult {
  channel: NotificationChannelType
}

/**
 * 외부 벤더사(Nodemailer, NHN, Slack 등) 연동을 위한 공통 Provider 추상 인터페이스
 */
export interface INotificationProvider<TMessage = unknown> {
  readonly providerName: string
  send(message: TMessage): Promise<NotificationProviderResult>
}

/**
 * 상위 채널(EmailChannel, SmsChannel 등)이 구현하는 통합 채널 규격
 */
export interface INotificationChannel {
  readonly channelType: NotificationChannelType
  send(payload: NotificationPayload): Promise<NotificationSendResult>
}

export interface MarketingAgreement {
  smsAgreed?: boolean
  kakaoAgreed?: boolean
  emailAgreed?: boolean
  pushAgreed?: boolean
}

export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');
export const NOTIFICATION_MODULE_OPTIONS = Symbol('NOTIFICATION_MODULE_OPTIONS');
