import type { AlimtalkMessageDto, EmailConfigDto, MessengerConfigDto, PushConfigDto, SmsConfigDto } from '#notification/dto';

export const NOTIFICATION_MODULE_OPTIONS = Symbol('NOTIFICATION_MODULE_OPTIONS');

export interface NotificationModuleOptions {
  requestTimeoutSeconds: number
  pushMessageTtlMinutes: number
  smtpConnectionTimeoutSeconds: number
  smtpGreetingTimeoutSeconds: number
  smtpSocketTimeoutSeconds: number
}

export type EmailMessage = {
  from: string
  to: string
  subject: string
  text: string
};

export type SmsMessage = { to: string, body: string, from?: string };
export type PushMessage = { token: string, title: string, body: string };
export type MessengerMessage = { recipient: string, body: string };

export type NotificationVariables = Record<string, string | number>;
export type EmailProviderConfig = Partial<Omit<EmailConfigDto, 'smtp'>> & { smtp?: Partial<EmailConfigDto['smtp']> };
export type SendNotificationInput
  = | { channel: 'email', message: { to: string, subject: string, text: string }, config?: EmailProviderConfig, variables?: NotificationVariables }
    | { channel: 'sms', message: SmsMessage, config?: SmsConfigDto, variables?: NotificationVariables }
    | { channel: 'push', message: PushMessage, config?: PushConfigDto, variables?: NotificationVariables }
    | { channel: 'messenger', message: MessengerMessage, config?: MessengerConfigDto, variables?: NotificationVariables }
    | { channel: 'alimtalk', message: AlimtalkMessageDto & { recipient: string }, config?: MessengerConfigDto, variables?: never };

export interface EmailAdapter {
  send(message: EmailMessage, providerConfig: unknown): Promise<string | undefined>
}
