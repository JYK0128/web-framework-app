import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { CreateOAuthIconPresignedUrlCommand } from '#/modules/system-config/commands/create-oauth-icon-presigned-url.command';
import type { CreateOAuthIconPresignedUrlResponseDto } from '#/modules/system-config/dto/create-oauth-icon-presigned-url.dto';
import { SystemConfigService } from '#/modules/system-config/system-config.service';

@Injectable()
@CommandHandler(CreateOAuthIconPresignedUrlCommand)
export class CreateOAuthIconPresignedUrlHandler implements ICommandHandler<CreateOAuthIconPresignedUrlCommand, CreateOAuthIconPresignedUrlResponseDto> {
  constructor(private readonly service: SystemConfigService) {}

  async execute(command: CreateOAuthIconPresignedUrlCommand): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    return this.service.createOAuthIconPresignedUrl(command.input);
  }
}
