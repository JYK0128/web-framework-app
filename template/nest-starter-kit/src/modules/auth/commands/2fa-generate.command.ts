import { Command } from '@nestjs/cqrs';

import { Generate2FARequestDto } from '#/modules/auth/dto/generate-2fa.request.dto';
import { Generate2FAResponseDto } from '#/modules/auth/dto/generate-2fa.response.dto';

export class Generate2FACommand extends Command<Generate2FAResponseDto> {
  constructor(public readonly input: Generate2FARequestDto) { super(); }
}
