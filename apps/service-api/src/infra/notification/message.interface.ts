import type { AlimtalkMessageDto, EmailConfigDto, MessengerConfigDto, PushConfigDto, SmsConfigDto } from '@pkg/shared/server';

import type { MessengerMessage, PushMessage, SmsMessage, WebhookMessage } from '#/infra/notification/notification.interface';

export type MessageVariables = Record<string, string | number>;
export type EmailProviderConfig = Partial<Omit<EmailConfigDto, 'smtp'>> & { smtp?: Partial<EmailConfigDto['smtp']> };
export type WebhookContent = { url: string, type: string, title: string, text: string };

export type SendMessageInput
  = | { channel: 'email', message: { to: string, subject: string, text: string }, config?: EmailProviderConfig, variables?: MessageVariables }
    | { channel: 'sms', message: SmsMessage, config?: SmsConfigDto, variables?: MessageVariables }
    | { channel: 'push', message: PushMessage, config?: PushConfigDto, variables?: MessageVariables }
    | { channel: 'messenger', message: MessengerMessage, config?: MessengerConfigDto, variables?: MessageVariables }
    | { channel: 'alimtalk', message: AlimtalkMessageDto & { recipient: string }, config?: MessengerConfigDto, variables?: never }
    | { channel: 'webhook', message: WebhookMessage | WebhookContent, variables?: MessageVariables };
