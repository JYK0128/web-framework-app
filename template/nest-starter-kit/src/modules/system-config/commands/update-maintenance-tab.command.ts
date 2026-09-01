import { Command } from '@nestjs/cqrs';
import type { AuthPrincipal } from 'express-session';

import type { UpdateMaintenanceTabRequestDto, UpdateMaintenanceTabResponseDto } from '#/modules/system-config/dto';

export class UpdateMaintenanceTabCommand extends Command<UpdateMaintenanceTabResponseDto> {
  constructor(
    public readonly input: UpdateMaintenanceTabRequestDto,
    public readonly adminUser: AuthPrincipal,
  ) {
    super();
  }
}
