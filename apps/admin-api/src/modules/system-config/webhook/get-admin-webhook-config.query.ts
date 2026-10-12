import { Query } from '@nestjs/cqrs';

import { AdminWebhookConfigResponseDto } from '#/modules/system-config/webhook/admin-webhook-config.response.dto';

export class GetAdminWebhookConfigQuery extends Query<AdminWebhookConfigResponseDto> {}
