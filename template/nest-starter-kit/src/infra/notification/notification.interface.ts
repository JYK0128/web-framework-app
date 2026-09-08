export enum NotificationChannelType {
  SMS = 'SMS',
  KAKAO = 'KAKAO',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

export type NotificationSmsProviderType = 'nhn-sms' | 'solapi-sms' | 'aligo-sms';
export type NotificationKakaoProviderType = 'nhn-alimtalk';
export type NotificationPushProviderType = 'FIREBASE' | 'NHN';

export interface NotificationSmsOptions {}

export interface NotificationKakaoOptions {
  nhn?: Record<string, unknown>
}

export interface NotificationPushOptions {
  fcm?: {
    projectId?: string
    clientEmail?: string
    privateKey?: string
    serviceAccountJson?: string
  }
  nhn?: {
    appKey?: string
    userAccessKeyId?: string
    secretAccessKey?: string
  }
}

export interface NotificationModuleOptions {
  /** SMS는 DB 설정 기반으로 동작하므로 모듈 옵션에서 제거됨 */
  kakao?: NotificationKakaoOptions
  push?: NotificationPushOptions
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
 * 모든 Adapter(SMS, Email, Kakao, Messenger 등)의 공통 반환 결과 규격
 */
export interface NotificationAdapterResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * NotificationService에서 채널 발송 후 반환하는 결과 규격
 */
export interface NotificationSendResult extends NotificationAdapterResult {
  channel: NotificationChannelType
}

/**
 * 외부 벤더사(Nodemailer, NHN, Slack 등) 연동을 위한 공통 Adapter 추상 인터페이스
 */
export interface INotificationAdapter<TMessage = unknown> {
  readonly providerName: string
  send(message: TMessage): Promise<NotificationAdapterResult>
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
  messengerAgreed?: boolean
  emailAgreed?: boolean
  pushAgreed?: boolean
}

export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');
export const NOTIFICATION_MODULE_OPTIONS = Symbol('NOTIFICATION_MODULE_OPTIONS');
