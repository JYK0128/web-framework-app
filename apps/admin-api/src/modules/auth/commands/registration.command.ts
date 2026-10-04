import { Command } from '@nestjs/cqrs';

import type { RegisterRequestDto, RegisterResponseDto } from '#/modules/auth/interfaces/registration.dto';

export class RegisterCommand extends Command<RegisterResponseDto> {
  constructor(public readonly input: RegisterRequestDto) { super(); }
}
