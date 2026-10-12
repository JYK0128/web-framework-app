import { Command } from '@nestjs/cqrs';

import type { LoginRequestDto, LoginResponseDto } from '#/modules/auth/dto';

export class LoginCommand extends Command<LoginResponseDto> {
  constructor(
    public readonly input: LoginRequestDto,
  ) {
    super();
  }
}
