import { Command } from '@nestjs/cqrs';
import type { AuthPrincipal } from 'express-session';

import type { UpdateSystemConfigRequestDto, UpdateSystemConfigResponseDto } from '#/modules/system-config/dto';

export class UpdateSystemConfigCommand extends Command<UpdateSystemConfigResponseDto> {
  constructor(
    public readonly input: UpdateSystemConfigRequestDto,
    public readonly adminUser: AuthPrincipal,
  ) {
    super();
  }
}
