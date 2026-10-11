import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { MessengerAdapter } from '#/core/notification/adapters/messenger.adapter';
import { PushAdapter } from '#/core/notification/adapters/push.adapter';
import { SmsAdapter } from '#/core/notification/adapters/sms.adapter';
import { SmtpAdapter } from '#/core/notification/adapters/smtp.adapter';

import type { NotificationVariables, SendNotificationInput } from './notification.interface';

@Injectable()
export class NotificationService {
  constructor(
    private readonly smtp: SmtpAdapter,
    private readonly sms: SmsAdapter,
    private readonly push: PushAdapter,
    private readonly messenger: MessengerAdapter,
  ) {}

  async send(input: SendNotificationInput): Promise<string | undefined> {
    const { variables } = input;
    switch (input.channel) {
      case 'email':
        return this.smtp.send({
          from: input.config?.from ?? '',
          to: input.message.to,
          subject: this.render(input.message.subject, variables),
          text: this.render(input.message.text, variables),
        }, input.config);
      case 'sms':
        return this.sms.send({ ...input.message, body: this.render(input.message.body, variables) }, input.config);
      case 'push':
        return this.push.send({
          ...input.message,
          title: this.render(input.message.title, variables),
          body: this.render(input.message.body, variables),
        }, input.config);
      case 'messenger':
        return this.messenger.send({ ...input.message, body: this.render(input.message.body, variables) }, input.config);
      case 'alimtalk':
        return this.messenger.sendAlimtalk(input.message, input.config);
    }
  }

  private render(template: string, variables?: NotificationVariables): string {
    if (variables === undefined) return template;
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match: string, key: string) => {
      if (!Object.hasOwn(variables, key)) throw new ApplicationError({ code: 'BAD_REQUEST', status: HttpStatus.BAD_REQUEST });
      return String(variables[key]);
    });
  }
}
