import type { INotificationProvider, NotificationProviderResult } from '#/common/services/notification/notification.interface';

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
}

export interface EmailMessage {
  to: string | string[]
  from?: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: EmailAttachment[]
}

export type EmailProviderResult = NotificationProviderResult;

export interface IEmailProvider extends INotificationProvider<EmailMessage> {}

export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
