import { Command } from '@nestjs/cqrs';
import type { AuthPrincipal } from 'express-session';

import type { UpdateMessagesTabRequestDto, UpdateMessagesTabResponseDto } from '#/modules/system-config/dto';

export class UpdateMessagesTabCommand extends Command<UpdateMessagesTabResponseDto> {
  constructor(
    public readonly input: UpdateMessagesTabRequestDto,
    public readonly adminUser: AuthPrincipal,
  ) {
    super();
  }
}
