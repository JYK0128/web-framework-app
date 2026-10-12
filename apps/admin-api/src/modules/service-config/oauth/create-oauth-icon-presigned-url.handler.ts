import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { InternalClient } from '#/core/http/internal-client';
import { CreateOAuthIconPresignedUrlCommand } from '#/modules/service-config/oauth/create-oauth-icon-presigned-url.command';
import { CreateOAuthIconPresignedUrlResponseDto } from '#/modules/service-config/oauth/create-oauth-icon-presigned-url.response.dto';

@Injectable()
@CommandHandler(CreateOAuthIconPresignedUrlCommand)
export class CreateOAuthIconPresignedUrlHandler implements ICommandHandler<CreateOAuthIconPresignedUrlCommand, CreateOAuthIconPresignedUrlResponseDto> {
  constructor(private readonly internalClient: InternalClient) {}

  async execute(command: CreateOAuthIconPresignedUrlCommand): Promise<CreateOAuthIconPresignedUrlResponseDto> {
    const result = await this.internalClient.fetch<CreateOAuthIconPresignedUrlResponseDto>('/internal/system-configs/oauth-icons/presigned-url', { method: 'POST', body: command.input });
    return CreateOAuthIconPresignedUrlResponseDto.parse({ ...result, uploadUrl: `/api/v1/uploads/oauth-icons/${result.fileUrl.split('/').pop()}` });
  }
}
