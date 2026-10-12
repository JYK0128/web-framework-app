import { Command } from '@nestjs/cqrs';

import type { RegisterRequestDto, RegisterResponseDto } from '#/modules/auth/dto';

export class RegisterCommand extends Command<RegisterResponseDto> {
  constructor(public readonly input: RegisterRequestDto) { super(); }
}
