import { Command } from '@nestjs/cqrs';

import { AdminWebhookConfigResponseDto } from '#/modules/system-config/dto/webhook/admin-webhook-config.response.dto';
import type { WebhookConfigDto } from '#/modules/system-config/dto/webhook/webhook-config.dto';

export class UpdateAdminWebhookConfigCommand extends Command<AdminWebhookConfigResponseDto> {
  constructor(public readonly input: WebhookConfigDto) {
    super();
  }
}
