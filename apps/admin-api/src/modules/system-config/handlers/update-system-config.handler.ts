import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type SystemConfigCode } from '@pkg/shared/common';

import { UpdateSystemConfigCommand } from '#/modules/system-config/commands';
import type { UpdateSystemConfigResponseDto } from '#/modules/system-config/system-config.interfaces';
import { SystemConfigService } from '#/modules/system-config/system-config.service';

@Injectable()
@CommandHandler(UpdateSystemConfigCommand)
export class UpdateSystemConfigHandler implements ICommandHandler<UpdateSystemConfigCommand, UpdateSystemConfigResponseDto> {
  constructor(private readonly service: SystemConfigService) {}

  async execute(command: UpdateSystemConfigCommand): Promise<UpdateSystemConfigResponseDto> {
    const updatedKeys = Object.keys(command.input) as SystemConfigCode[];
    await this.service.update(command.input);
    return { ok: true, updatedKeys };
  }
}
