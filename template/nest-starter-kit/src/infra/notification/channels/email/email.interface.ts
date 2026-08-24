import type { SendMailOptions } from 'nodemailer';

import type { INotificationAdapter, NotificationAdapterResult } from '#/infra/notification/notification.interface';

export type EmailMessage = SendMailOptions;
export type EmailAdapterResult = NotificationAdapterResult;

export interface IEmailAdapter extends INotificationAdapter<EmailMessage> {}

export const EMAIL_ADAPTER = Symbol('EMAIL_ADAPTER');
