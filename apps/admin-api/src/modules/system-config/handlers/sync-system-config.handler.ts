import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { SyncSystemConfigCommand } from '#/modules/system-config/commands/sync-system-config.command';
import { ServiceSystemConfigClient } from '#/modules/system-config/service-system-config.client';
import type { SyncSystemConfigResponseDto } from '#/modules/system-config/system-config.interfaces';

@Injectable()
@CommandHandler(SyncSystemConfigCommand)
export class SyncSystemConfigHandler implements ICommandHandler<SyncSystemConfigCommand, SyncSystemConfigResponseDto> {
  constructor(private readonly systemConfigService: ServiceSystemConfigClient) {}

  async execute(_command: SyncSystemConfigCommand): Promise<SyncSystemConfigResponseDto> {
    await this.systemConfigService.syncToRedis();
    return { ok: true, message: '서비스 설정을 Redis에 동기화했습니다.' };
  }
}
