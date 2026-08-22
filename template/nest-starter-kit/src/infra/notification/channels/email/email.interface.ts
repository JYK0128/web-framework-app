import type { SendMailOptions } from 'nodemailer';

import type { INotificationProvider, NotificationProviderResult } from '#/infra/notification/notification.interface';

export type EmailMessage = SendMailOptions;
export type EmailProviderResult = NotificationProviderResult;

export interface IEmailProvider extends INotificationProvider<EmailMessage> {}

export const EMAIL_PROVIDER = Symbol('EMAIL_PROVIDER');
