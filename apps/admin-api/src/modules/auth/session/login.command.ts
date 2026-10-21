import { Command } from '@nestjs/cqrs';

import type { LoginRequestDto } from '~/modules/auth/session/login.request.dto';
import type { LoginResponseDto } from '~/modules/auth/session/login.response.dto';

export class LoginCommand extends Command<LoginResponseDto> {
  constructor(
    public readonly input: LoginRequestDto,
  ) {
    super();
  }
}
