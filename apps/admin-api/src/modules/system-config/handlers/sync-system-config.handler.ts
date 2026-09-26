import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { SyncSystemConfigCommand } from '#/modules/system-config/commands/sync-system-config.command';
import type { SyncSystemConfigResponseDto } from '#/modules/system-config/system-config.interfaces';
import { SystemConfigService } from '#/modules/system-config/system-config.service';

@Injectable()
@CommandHandler(SyncSystemConfigCommand)
export class SyncSystemConfigHandler implements ICommandHandler<SyncSystemConfigCommand, SyncSystemConfigResponseDto> {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  async execute(_command: SyncSystemConfigCommand): Promise<SyncSystemConfigResponseDto> {
    await this.systemConfigService.syncToRedis();
    return { ok: true, message: '서비스 설정을 Redis에 동기화했습니다.' };
  }
}
