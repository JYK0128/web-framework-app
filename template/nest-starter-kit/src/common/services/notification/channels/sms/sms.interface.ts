import type { INotificationProvider, NotificationProviderResult } from '#/common/services/notification/notification.interface';

export interface SmsMessage {
  to: string
  from?: string
  body: string
}

export type SmsProviderResult = NotificationProviderResult;

export interface ISmsProvider extends INotificationProvider<SmsMessage> {}

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');
