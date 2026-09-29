import { Query } from '@nestjs/cqrs';

import type { WebhookConfigDto } from '#/modules/system-configs/dto/webhook/webhook-config.dto';

export class GetAdminWebhookConfigQuery extends Query<WebhookConfigDto> {}
