import { Command } from '@nestjs/cqrs';

import type { DeferPasswordResponseDto } from '#/modules/auth/dto/defer-password.response.dto';
import type { DeferPasswordRequestDto } from '#/modules/auth/dto/defer-password.request.dto';

export class DeferPasswordCommand extends Command<DeferPasswordResponseDto> {
  constructor(public readonly input: DeferPasswordRequestDto) {
    super();
  }
}
