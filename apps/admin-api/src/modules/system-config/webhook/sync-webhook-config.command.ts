import { Command } from '@nestjs/cqrs';

import type { SyncWebhookConfigResponseDto } from './sync-webhook-config.response.dto';

export class SyncWebhookConfigCommand extends Command<SyncWebhookConfigResponseDto> {
}
