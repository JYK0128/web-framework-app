import { Command } from '@nestjs/cqrs';

import type { DeferPasswordRequestDto } from '#/modules/auth/dto/defer-password.request.dto';
import type { DeferPasswordResponseDto } from '#/modules/auth/dto/defer-password.response.dto';

export class DeferPasswordCommand extends Command<DeferPasswordResponseDto> {
  constructor(public readonly input: DeferPasswordRequestDto) {
    super();
  }
}
