import { Command } from '@nestjs/cqrs';

import type { SyncWebhookConfigRequestDto } from '#/modules/system-config/webhook/sync-webhook-config.request.dto';
import type { SyncWebhookConfigResponseDto } from '#/modules/system-config/webhook/sync-webhook-config.response.dto';

export class SyncWebhookConfigCommand extends Command<SyncWebhookConfigResponseDto> {
  constructor(public readonly input: SyncWebhookConfigRequestDto) { super(); }
}
