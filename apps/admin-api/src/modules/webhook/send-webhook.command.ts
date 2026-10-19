import { Command } from '@nestjs/cqrs';

import type { SendWebhookRequestDto } from '#/modules/webhook/send-webhook.request.dto';
import type { SendWebhookResponseDto } from '#/modules/webhook/send-webhook.response.dto';

export class SendWebhookCommand extends Command<SendWebhookResponseDto> {
  constructor(public readonly input: SendWebhookRequestDto) { super(); }
}
