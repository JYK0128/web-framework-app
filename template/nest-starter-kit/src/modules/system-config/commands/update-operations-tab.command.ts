import { Command } from '@nestjs/cqrs';
import type { AuthPrincipal } from 'express-session';

import type { UpdateOperationsTabRequestDto, UpdateOperationsTabResponseDto } from '#/modules/system-config/dto';

export class UpdateOperationsTabCommand extends Command<UpdateOperationsTabResponseDto> {
  constructor(
    public readonly input: UpdateOperationsTabRequestDto,
    public readonly adminUser: AuthPrincipal,
  ) {
    super();
  }
}
