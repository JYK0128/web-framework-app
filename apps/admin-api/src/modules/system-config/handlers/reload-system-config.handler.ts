import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { SystemConfigCode } from '#/entities/system-configs/system-config.entity';
import { ReloadSystemConfigCommand } from '#/modules/system-config/commands';
import type { ReloadSystemConfigResponseDto } from '#/modules/system-config/system-config.interfaces';

@Injectable()
@CommandHandler(ReloadSystemConfigCommand)
export class ReloadSystemConfigHandler implements ICommandHandler<ReloadSystemConfigCommand, ReloadSystemConfigResponseDto> {
  execute(): Promise<ReloadSystemConfigResponseDto> {
    return Promise.resolve({ ok: true, reloadedKeys: Object.values(SystemConfigCode) });
  }
}
