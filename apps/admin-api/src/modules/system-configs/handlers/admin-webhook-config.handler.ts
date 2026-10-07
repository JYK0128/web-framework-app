import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AdminWebhookConfigService } from '#/modules/system-configs/admin-webhook-config.service';
import type { WebhookConfigDto } from '#/modules/system-configs/dto/webhook/webhook-config.dto';
import { GetAdminWebhookConfigQuery } from '#/modules/system-configs/queries/get-admin-webhook-config.query';

@Injectable()
@QueryHandler(GetAdminWebhookConfigQuery)
export class GetAdminWebhookConfigHandler implements IQueryHandler<GetAdminWebhookConfigQuery, WebhookConfigDto> {
  constructor(private readonly service: AdminWebhookConfigService) {}

  execute(): Promise<WebhookConfigDto> {
    return this.service.getResponse();
  }
}
