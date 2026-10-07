import { Command } from '@nestjs/cqrs';

import type { CreateOAuthIconPresignedUrlRequestDto, CreateOAuthIconPresignedUrlResponseDto } from '#/modules/system-config/dto';

export class CreateOAuthIconPresignedUrlCommand extends Command<CreateOAuthIconPresignedUrlResponseDto> {
  constructor(public readonly input: CreateOAuthIconPresignedUrlRequestDto) {
    super();
  }
}
