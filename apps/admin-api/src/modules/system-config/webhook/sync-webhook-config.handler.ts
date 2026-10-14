import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { InternalClient } from '#/core/internal-client';
import { SystemContext } from '#/core/system.context';
import { AdminWebhookConfigResponseDto } from '#/modules/system-config/webhook/admin-webhook-config.response.dto';
import { SyncWebhookConfigCommand } from '#/modules/system-config/webhook/sync-webhook-config.command';
import { SyncWebhookConfigResponseDto } from '#/modules/system-config/webhook/sync-webhook-config.response.dto';

@Injectable()
@CommandHandler(SyncWebhookConfigCommand)
export class SyncWebhookConfigHandler implements ICommandHandler<SyncWebhookConfigCommand, SyncWebhookConfigResponseDto> {
  constructor(private readonly systemContext: SystemContext,
    private readonly internalClient: InternalClient,
  ) {}

  async execute(_command: SyncWebhookConfigCommand): Promise<SyncWebhookConfigResponseDto> {
    const { webhook: value } = await this.systemContext.getConfig();
    const webhook = AdminWebhookConfigResponseDto.parse(value);
    await this.internalClient.fetch<string[]>('/internal/system-config', { method: 'PATCH', body: { webhook } });
    return SyncWebhookConfigResponseDto.parse({ ok: true });
  }
}
