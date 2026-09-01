import { Command } from '@nestjs/cqrs';
import type { AuthPrincipal } from 'express-session';

import type { UpdateSecurityTabRequestDto, UpdateSecurityTabResponseDto } from '#/modules/system-config/dto';

export class UpdateSecurityTabCommand extends Command<UpdateSecurityTabResponseDto> {
  constructor(
    public readonly input: UpdateSecurityTabRequestDto,
    public readonly adminUser: AuthPrincipal,
  ) {
    super();
  }
}
