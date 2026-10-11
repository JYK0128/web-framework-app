import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { UpdateSystemConfigCommand } from '#/modules/system-configs/commands';
import type { UpdateSystemConfigResponseDto } from '#/modules/system-configs/dto/update-system-config.response.dto';
import { ServiceSystemConfigClient } from '#/modules/system-configs/service-system-config.client';

@Injectable()
@CommandHandler(UpdateSystemConfigCommand)
export class UpdateSystemConfigHandler implements ICommandHandler<UpdateSystemConfigCommand, UpdateSystemConfigResponseDto> {
  constructor(private readonly service: ServiceSystemConfigClient) {}

  async execute(command: UpdateSystemConfigCommand): Promise<UpdateSystemConfigResponseDto> {
    const updatedKeys = await this.service.update(command.input);
    return { ok: true, updatedKeys };
  }
}
