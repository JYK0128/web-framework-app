import { Command } from '@nestjs/cqrs';

import type { CurrentUserResponseDto } from '#/modules/auth/dto/current-user.response.dto';
import type { LoginRequestDto } from '#/modules/auth/dto/login.request.dto';

export class LoginCommand extends Command<CurrentUserResponseDto> {
  constructor(
    public readonly input: LoginRequestDto,
  ) {
    super();
  }
}
