import { Injectable } from '@nestjs/common';

import { SmtpAdapter } from '#/infra/notification/adapters/email/smtp.adapter';
import { MessengerAdapter } from '#/infra/notification/adapters/messenger/messenger.adapter';
import { PushAdapter } from '#/infra/notification/adapters/push/push.adapter';
import { SmsAdapter } from '#/infra/notification/adapters/sms/sms.adapter';
import { WebhookAdapter } from '#/infra/notification/adapters/webhook/webhook.adapter';

import type { SendMessageInput } from './message.interface';
import { MessageTemplateService } from './message-template.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly smtp: SmtpAdapter,
    private readonly sms: SmsAdapter,
    private readonly push: PushAdapter,
    private readonly messenger: MessengerAdapter,
    private readonly webhook: WebhookAdapter,
    private readonly templates: MessageTemplateService,
  ) {}

  async send(input: SendMessageInput): Promise<string | undefined> {
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
      case 'webhook': {
        const message = input.message;
        const payload = 'payload' in message ? message.payload : this.templates.webhookPayload(message, variables);
        await this.webhook.send({ url: message.url, type: message.type, payload });
        return undefined;
      }
    }
  }
}
