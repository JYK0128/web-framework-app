import type { INotificationAdapter, NotificationAdapterResult } from '#/infra/notification/notification.interface';

export interface SmsMessage {
  to: string
  from?: string
  body: string
}

export type SmsAdapterResult = NotificationAdapterResult;

export interface ISmsAdapter extends INotificationAdapter<SmsMessage> {}

export const SMS_ADAPTER = Symbol('SMS_ADAPTER');
