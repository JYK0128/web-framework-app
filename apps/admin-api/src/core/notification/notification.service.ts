import { Injectable } from '@nestjs/common';

import { SmtpAdapter } from '#/core/notification/adapters/email/smtp.adapter';
import { MessengerAdapter } from '#/core/notification/adapters/messenger/messenger.adapter';
import { PushAdapter } from '#/core/notification/adapters/push/push.adapter';
import { SmsAdapter } from '#/core/notification/adapters/sms/sms.adapter';

import type { SendNotificationInput } from './notification-request.interface';
import { NotificationTemplateService } from './notification-template.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly smtp: SmtpAdapter,
    private readonly sms: SmsAdapter,
    private readonly push: PushAdapter,
    private readonly messenger: MessengerAdapter,
    private readonly templates: NotificationTemplateService,
  ) {}

  async send(input: SendNotificationInput): Promise<string | undefined> {
    const { variables } = input;
    switch (input.channel) {
      case 'email':
        return this.smtp.send({
          from: input.config?.from ?? '',
          to: input.message.to,
          subject: this.templates.render(input.message.subject, variables),
          text: this.templates.render(input.message.text, variables),
        }, input.config);
      case 'sms':
        return this.sms.send({ ...input.message, body: this.templates.render(input.message.body, variables) }, input.config);
      case 'push':
        return this.push.send({
          ...input.message,
          title: this.templates.render(input.message.title, variables),
          body: this.templates.render(input.message.body, variables),
        }, input.config);
      case 'messenger':
        return this.messenger.send({ ...input.message, body: this.templates.render(input.message.body, variables) }, input.config);
      case 'alimtalk':
        return this.messenger.sendAlimtalk(input.message, input.config);
    }
  }
}
