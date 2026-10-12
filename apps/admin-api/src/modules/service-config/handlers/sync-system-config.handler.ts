import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler, QueryBus } from '@nestjs/cqrs';
import type { ServiceSystemConfigCode } from '@pkg/shared/constants';

import { InternalClient } from '#/core/http/internal-client';
import { SyncSystemConfigCommand } from '#/modules/service-config/commands/sync-system-config.command';
import { SyncSystemConfigResponseDto } from '#/modules/service-config/dto/sync-system-config.response.dto';
import { GetAdminWebhookConfigQuery } from '#/modules/system-config/queries/get-admin-webhook-config.query';

@Injectable()
@CommandHandler(SyncSystemConfigCommand)
export class SyncSystemConfigHandler implements ICommandHandler<SyncSystemConfigCommand, SyncSystemConfigResponseDto> {
  constructor(private readonly queryBus: QueryBus,
    private readonly internalClient: InternalClient,
  ) {}

  async execute(_command: SyncSystemConfigCommand): Promise<SyncSystemConfigResponseDto> {
    const webhook = await this.queryBus.execute(new GetAdminWebhookConfigQuery());
    await this.internalClient.fetch<ServiceSystemConfigCode[]>('/internal/system-configs', { method: 'PATCH', body: { webhook } });
    return SyncSystemConfigResponseDto.parse({ ok: true });
  }
}
