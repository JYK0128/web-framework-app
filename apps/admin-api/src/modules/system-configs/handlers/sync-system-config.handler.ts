import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AdminWebhookConfigService } from '#/modules/system-configs/admin-webhook-config.service';
import { SyncSystemConfigCommand } from '#/modules/system-configs/commands/sync-system-config.command';
import { ServiceSystemConfigClient } from '#/modules/system-configs/service-system-config.client';
import type { SyncSystemConfigResponseDto } from '#/modules/system-configs/system-config.interfaces';

@Injectable()
@CommandHandler(SyncSystemConfigCommand)
export class SyncSystemConfigHandler implements ICommandHandler<SyncSystemConfigCommand, SyncSystemConfigResponseDto> {
  constructor(
    private readonly systemConfigService: ServiceSystemConfigClient,
    private readonly adminWebhookConfigService: AdminWebhookConfigService,
  ) {}

  async execute(_command: SyncSystemConfigCommand): Promise<SyncSystemConfigResponseDto> {
    const webhook = await this.adminWebhookConfigService.getResponse();
    await this.systemConfigService.update({ webhook });
    return { ok: true, message: '서비스 설정을 Redis에 동기화했습니다.' };
  }
}
