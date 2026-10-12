import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { ServiceSystemConfigCode } from '@pkg/shared/constants';

import { InternalClient } from '#/core/http/internal-client';
import { UpdateSystemConfigCommand } from '#/modules/service-config/update-system-config.command';
import { UpdateSystemConfigResponseDto } from '#/modules/system-config/update-system-config.response.dto';

@Injectable()
@CommandHandler(UpdateSystemConfigCommand)
export class UpdateSystemConfigHandler implements ICommandHandler<UpdateSystemConfigCommand, UpdateSystemConfigResponseDto> {
  constructor(private readonly internalClient: InternalClient) {}

  async execute(command: UpdateSystemConfigCommand): Promise<UpdateSystemConfigResponseDto> {
    const updatedKeys = await this.internalClient.fetch<ServiceSystemConfigCode[]>('/internal/system-configs', { method: 'PATCH', body: command.input });
    return UpdateSystemConfigResponseDto.parse({ ok: true, updatedKeys });
  }
}
