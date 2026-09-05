import type { Options as SmtpTransportOptions } from 'nodemailer/lib/smtp-transport';

export enum NotificationChannelType {
  SMS = 'SMS',
  KAKAO = 'KAKAO',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

export type NotificationEmailProviderType = 'smtp' | 'nhn-email' | 'aws-ses';
export type NotificationSmsProviderType = 'nhn-sms' | 'aws-sns';
export type NotificationKakaoProviderType = 'nhn-alimtalk';
export type NotificationPushProviderType = 'firebase-fcm' | 'nhn-push';

export interface SmtpConfig extends SmtpTransportOptions {
  from: string
}

export interface NhnEmailConfig {
  appKey?: string
  secretKey?: string
  senderAddress?: string
}

export interface AwsSesEmailConfig {
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  senderAddress?: string
}

export interface NhnSmsConfig {
  appKey?: string
  secretKey?: string
  senderPhone?: string
}

export interface AwsSnsSmsConfig {
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  senderId?: string
}

export interface AlimtalkKakaoConfig {
  appKey?: string
  secretKey?: string
  senderKey?: string
  plusFriendId?: string
}

export type NhnKakaoConfig = AlimtalkKakaoConfig;

export interface FcmPushConfig {
  projectId?: string
  clientEmail?: string
  privateKey?: string
}

export interface NhnPushConfig {
  appKey?: string
  secretKey?: string
}

export interface NotificationEmailOptions {
  smtp?: SmtpConfig
  nhn?: NhnEmailConfig
  ses?: AwsSesEmailConfig
}

export interface NotificationSmsOptions {
  nhn?: NhnSmsConfig
  sns?: AwsSnsSmsConfig
}

export interface NotificationKakaoOptions {
  nhn?: NhnKakaoConfig
}

export interface NotificationPushOptions {
  fcm?: FcmPushConfig
  nhn?: NhnPushConfig
}

export interface NotificationModuleOptions {
  email?: NotificationEmailOptions
  sms?: NotificationSmsOptions
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
  kakaoAgreed?: boolean
  emailAgreed?: boolean
  pushAgreed?: boolean
}

export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');
export const NOTIFICATION_MODULE_OPTIONS = Symbol('NOTIFICATION_MODULE_OPTIONS');
