import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { CreateOAuthIconPresignedUrlCommand } from '#/modules/system-configs/commands/create-oauth-icon-presigned-url.command';
import type { CreateOAuthIconPresignedUrlResponseDto } from '#/modules/system-configs/dto/create-oauth-icon-presigned-url.dto';
import { ServiceSystemConfigClient } from '#/modules/system-configs/service-system-config.client';

@Injectable()
@CommandHandler(CreateOAuthIconPresignedUrlCommand)
export class CreateOAuthIconPresignedUrlHandler implements ICommandHandler<CreateOAuthIconPresignedUrlCommand, CreateOAuthIconPresignedUrlResponseDto> {
  constructor(private readonly service: ServiceSystemConfigClient) {}

  async execute(command: CreateOAuthIconPresignedUrlCommand): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    return this.service.createOAuthIconPresignedUrl(command.input);
  }
}
