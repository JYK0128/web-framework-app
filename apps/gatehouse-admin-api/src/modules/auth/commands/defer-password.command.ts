import { Command } from '@nestjs/cqrs';

import type { DeferPasswordResponseDto } from '#/modules/auth/dto/defer-password.response.dto';

export class DeferPasswordCommand extends Command<DeferPasswordResponseDto> {
  constructor() {
    super();
  }
}
