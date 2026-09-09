import type { SendMailOptions } from 'nodemailer';

import type { INotificationAdapter, NotificationAdapterResult } from '#/infra/notification/notification.interface';
import type { NotificationConfigDto } from '#/modules/system-config/dto';

export type EmailMessage = SendMailOptions;
export type EmailAdapterResult = NotificationAdapterResult;

export interface IEmailAdapter extends INotificationAdapter<EmailMessage> {
  send(message: EmailMessage, overrideConfig?: NotificationConfigDto['email']): Promise<NotificationAdapterResult>
}

export const EMAIL_ADAPTER = Symbol('EMAIL_ADAPTER');
