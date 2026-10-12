import { Command } from '@nestjs/cqrs';

import type { ChangePasswordRequestDto, ChangePasswordResponseDto } from '#/modules/auth/dto';

export class ChangePasswordCommand extends Command<ChangePasswordResponseDto> {
  constructor(public readonly input: ChangePasswordRequestDto) { super(); }
}
