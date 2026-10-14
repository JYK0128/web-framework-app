import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { InternalClient } from '#/core/internal-client';
import { SystemContext } from '#/core/system.context';
import { AdminEmailConfigResponseDto } from '#/modules/system-config/admin-email/admin-email-config.response.dto';
import { GetSystemConfigQuery } from '#/modules/system-config/get-system-config.query';
import { GetSystemConfigResponseDto } from '#/modules/system-config/get-system-config.response.dto';
import type { ServiceSystemConfigResponseDto } from '#/modules/system-config/service-system-config.response.dto';
import { AdminWebhookConfigResponseDto } from '#/modules/system-config/webhook/admin-webhook-config.response.dto';

@Injectable()
@QueryHandler(GetSystemConfigQuery)
export class GetSystemConfigHandler implements IQueryHandler<GetSystemConfigQuery, GetSystemConfigResponseDto> {
  constructor(private readonly internalClient: InternalClient, private readonly systemContext: SystemContext) {}

  async execute(): Promise<GetSystemConfigResponseDto> {
    const [config, systemConfig] = await Promise.all([
      this.internalClient.fetch<ServiceSystemConfigResponseDto>('/internal/system-config'),
      this.systemContext.getConfig(),
    ]);
    return GetSystemConfigResponseDto.parse({
      notification: config.notification,
      oauth: config.oauth,
      webhook: AdminWebhookConfigResponseDto.parse(systemConfig.webhook),
      adminEmail: AdminEmailConfigResponseDto.parseValue(systemConfig.adminEmail),
    });
  }
}
