import { Command } from '@nestjs/cqrs';

import type { CurrentUserResponseDto } from '#/modules/auth/dto/current-user.response.dto';
import type { RegisterRequestDto } from '#/modules/auth/dto/register.request.dto';

export class RegisterCommand extends Command<CurrentUserResponseDto> {
  constructor(
    public readonly input: RegisterRequestDto,
  ) {
    super();
  }
}
