import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { InternalClient } from '#/core/http/internal-client';
import { UpdateServiceConfigCommand } from '#/modules/service-config/update-service-config.command';
import { UpdateServiceConfigResponseDto } from '#/modules/service-config/update-service-config.response.dto';

@Injectable()
@CommandHandler(UpdateServiceConfigCommand)
export class UpdateServiceConfigHandler implements ICommandHandler<UpdateServiceConfigCommand, UpdateServiceConfigResponseDto> {
  constructor(private readonly internalClient: InternalClient) {}

  async execute(command: UpdateServiceConfigCommand): Promise<UpdateServiceConfigResponseDto> {
    const updatedKeys = await this.internalClient.fetch<string[]>('/internal/system-config', { method: 'PATCH', body: command.input });
    return UpdateServiceConfigResponseDto.parse({ ok: true, updatedKeys });
  }
}
