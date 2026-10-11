import { Command } from '@nestjs/cqrs';

import type { RegisterRequestDto } from '#/modules/auth/dto/register.request.dto';
import type { RegisterResponseDto } from '#/modules/auth/dto/register.response.dto';

export class RegisterCommand extends Command<RegisterResponseDto> {
  constructor(public readonly input: RegisterRequestDto) { super(); }
}
