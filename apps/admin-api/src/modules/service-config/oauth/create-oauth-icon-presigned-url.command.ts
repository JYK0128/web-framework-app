import { Command } from '@nestjs/cqrs';

import type { CreateOAuthIconPresignedUrlRequestDto } from '#/modules/service-config/oauth/create-oauth-icon-presigned-url.request.dto';
import type { CreateOAuthIconPresignedUrlResponseDto } from '#/modules/service-config/oauth/create-oauth-icon-presigned-url.response.dto';

export class CreateOAuthIconPresignedUrlCommand extends Command<CreateOAuthIconPresignedUrlResponseDto> {
  constructor(public readonly input: CreateOAuthIconPresignedUrlRequestDto) { super(); }
}
